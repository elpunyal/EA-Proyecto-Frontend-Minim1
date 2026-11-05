import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, finalize, switchMap, tap } from 'rxjs';

import { Exercise, Question } from '../../models';
import { QuestionService } from '../../services/question.service';
import { apiErrorMessage } from '../../utils/api-error';
import { Pagination } from '../pagination/pagination';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-questions-list',
  imports: [FormsModule, DatePipe, Pagination],
  templateUrl: './questions-list.html',
})
export class QuestionsList implements OnInit {
  private questionService = inject(QuestionService);
  private pageRequests = new Subject<number>();

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

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.page.set(page);
    this.pageRequests.next(page);
  }
}
