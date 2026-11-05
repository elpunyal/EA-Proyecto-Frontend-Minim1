import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Exercise, Question, QuestionInput } from '../../models';
import { QuestionService } from '../../services/question.service';
import { apiErrorMessage } from '../../utils/api-error';

@Component({
  selector: 'app-question-form',
  imports: [ReactiveFormsModule],
  templateUrl: './question-form.html',
  styles: `
    :host {
      display: block;
      max-width: 560px;
    }
  `,
})
export class QuestionForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private questionService = inject(QuestionService);

  // El ejercicio sobre el que se pregunta (lo pasa la lista de preguntas)
  exercise = input.required<Exercise>();

  // Si llega una pregunta, el formulario sirve para editarla; si no, para crear una nueva
  question = input<Question>();

  // Avisa a la lista cuando se ha guardado la pregunta o se cancela
  saved = output<void>();
  cancelled = output<void>();

  saving = signal(false);
  error = signal('');

  form = this.fb.group({
    title: ['', [Validators.required, Validators.pattern(/\S/)]],
    text: ['', [Validators.required, Validators.pattern(/\S/)]],
  });

  ngOnInit(): void {
    // Al editar, rellenamos el formulario con los datos de la pregunta
    const question = this.question();
    if (question) {
      this.form.patchValue({ title: question.title, text: question.text });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // El autor no se envía: la API lo saca del token
    // vinculamos el ejercicio al crear la pregunta
    const question: QuestionInput = { ...this.form.getRawValue(), exercise: this.exercise()._id };

    // Al editar solo se envían el título y el texto
    const editing = this.question();
    const request = editing
      ? this.questionService.updateQuestion(editing._id, this.form.getRawValue())
      : this.questionService.createQuestion(question);

    this.saving.set(true);
    this.error.set('');
    request.subscribe({
      next: () => {
        // avisamos al componente padre para que cierre el form y recargue la tabla
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.saving.set(false);
      },
    });
  }
}
