import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, switchMap, tap } from 'rxjs';

import { Exercise, Question } from '../../models';
import { AuthService } from '../../services/auth.service';
import { QuestionService } from '../../services/question.service';
import { apiErrorMessage } from '../../utils/api-error';
import { Pagination } from '../pagination/pagination';
import { QuestionForm } from '../question-form/question-form';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-questions-list',
  imports: [FormsModule, DatePipe, Pagination, QuestionForm],
  templateUrl: './questions-list.html',
})
export class QuestionsList implements OnInit {
  private questionService = inject(QuestionService);
  private pageRequests = new Subject<number>();
  auth = inject(AuthService);

  // El ejercicio del que se muestran las preguntas (lo pasa la lista de ejercicios)
  exercise = input.required<Exercise>();

  questions = signal<Question[]>([]);
  total = signal(0);
  totalPages = signal(1);
  loading = signal(true);
  error = signal('');

  // Buscador por texto. Cualquier cambio vuelve a pedir la pagina 1
  search = signal('');
  page = signal(1);

  constructor() {
    this.pageRequests
      .pipe(
        switchMap((page) => {
          this.loading.set(true);
          this.error.set('');
          // combinamos los 2 filtros: texto y ejercicio
          return this.questionService
            .getQuestions({
              page,
              limit: PAGE_SIZE,
              search: this.search(),
              exercise: this.exercise()._id,
            })
            .pipe(
              tap((response) => {
                this.questions.set(response.questions);
                this.total.set(response.pagination.total);
                this.totalPages.set(Math.max(response.pagination.totalPages, 1));
                this.page.set(response.pagination.page);
              }),
              catchError((err: HttpErrorResponse) => {
                this.error.set(apiErrorMessage(err));
                return EMPTY;
              }),
              finalize(() => this.loading.set(false)),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  // Si es true se ve el formulario para crear una pregunta nueva
  creating = signal(false);

  // Pregunta abierta para ver sus respuestas (null si no hay ninguna)
  openedId = signal<string | null>(null);

  // Pregunta que se esta editando (null si no se edita ninguna)
  editingId = signal<string | null>(null);

  // Texto de la respuesta que se esta escribiendo
  answerText = signal('');
  answering = signal(false);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.page.set(page);
    this.pageRequests.next(page);
  }

  // Cuando se guarda la pregunta (nueva o editada), cerramos el formulario y recargamos la lista
  onSaved(): void {
    this.creating.set(false);
    this.editingId.set(null);
    this.loadPage(this.page());
  }

  // La pregunta es mia si el autor es el usuario con sesion
  isOwner(question: Question): boolean {
    return this.auth.user()?._id === question.author._id;
  }

  // No se puede responder la propia pregunta ni una borrada (regla de negocio del examen)
  canAnswer(question: Question): boolean {
    return !question.isDeleted && !this.isOwner(question);
  }

  // Solo el autor o un admin puede editar la pregunta
  canEdit(question: Question): boolean {
    return !question.isDeleted && (this.auth.isAdmin() || this.isOwner(question));
  }

  /** Abre o cierra el detalle de la pregunta (su texto y sus respuestas) */
  toggleOpen(question: Question): void {
    this.openedId.set(this.openedId() === question._id ? null : question._id);
    this.editingId.set(null);
    this.answerText.set('');
  }

  /** Abre o cierra el formulario para editar la pregunta */
  toggleEdit(question: Question): void {
    this.editingId.set(this.editingId() === question._id ? null : question._id);
  }

  /** POST /questions/:id/answers. El autor de la respuesta lo saca la API del token */
  sendAnswer(question: Question): void {
    const text = this.answerText().trim();
    if (!text) {
      return;
    }

    this.answering.set(true);
    this.error.set('');
    this.questionService.answerQuestion(question._id, { text }).subscribe({
      next: (response) => {
        // actualizamos la pregunta en la lista con la que devuelve el backend
        this.questions.set(
          this.questions().map((item) => (item._id === question._id ? response.question : item)),
        );
        this.answerText.set('');
        this.answering.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.answering.set(false);
      },
    });
  }
}
