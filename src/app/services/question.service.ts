import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AnswerInput,
  Question,
  QuestionInput,
  QuestionListParams,
  QuestionsPage,
  QuestionUpdate,
} from '../models';
import { buildListParams } from '../utils/list-params';

export interface QuestionResponse {
  question: Question;
}

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/questions`;

  /** GET /questions */
  getQuestions(params: QuestionListParams = {}): Observable<QuestionsPage> {
    return this.http.get<QuestionsPage>(this.baseUrl, { params: buildListParams(params) });
  }

  /** GET /questions/:id */
  getQuestion(id: string): Observable<QuestionResponse> {
    return this.http.get<QuestionResponse>(`${this.baseUrl}/${id}`);
  }

  /** POST /questions. El autor sale del token, no se envia */
  createQuestion(payload: QuestionInput): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(this.baseUrl, payload);
  }

  /** PUT /questions/:id. Solo se pueden cambiar el titulo y el texto */
  updateQuestion(id: string, payload: QuestionUpdate): Observable<QuestionResponse> {
    return this.http.put<QuestionResponse>(`${this.baseUrl}/${id}`, payload);
  }

  /** DELETE /questions/:id. Borrado logico: la API solo marca isDeleted */
  softDeleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** DELETE /questions/:id/hard. Borrado definitivo de la base de datos (solo ADMIN) */
  hardDeleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/hard`);
  }

  /** POST /questions/:id/answers. Responde una pregutna, el autor sale del token */
  answerQuestion(id: string, payload: AnswerInput): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(`${this.baseUrl}/${id}/answers`, payload);
  }
}
