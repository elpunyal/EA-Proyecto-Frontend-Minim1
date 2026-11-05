import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Exercise } from '../../models';
import { ExerciseService } from '../../services/exercise.service';
import { apiErrorMessage } from '../../utils/api-error';
import { QuestionsList } from '../questions-list/questions-list';

@Component({
  selector: 'app-exercise-questions',
  imports: [RouterLink, QuestionsList],
  templateUrl: './exercise-questions.html',
})
export class ExerciseQuestions implements OnInit {
  private exerciseService = inject(ExerciseService);

  // Viene del :id de la ruta: es el id del ejercicio
  id = input.required<string>();

  exercise = signal<Exercise | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    // Cargamos el ejercicio para pasarselo al listado de preguntas
    this.exerciseService.getExercise(this.id()).subscribe({
      next: (response) => {
        this.exercise.set(response.exercise);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(apiErrorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
