import type { Exercise } from './exercise.model';
import type { ListParams, PageInfo } from './page.model';
import type { UserSummary } from './user.model';

// Una respuesta de una pregunta (subdocumento). Al leer, la API devuelve el autor
// con populate (id y nombre)
export interface Answer {
  _id: string;
  text: string;
  author: UserSummary;
  createdAt: string;
}

// Al responder solo se envía el texto, el autor sale del token
export interface AnswerInput {
  text: string;
}

// Al crear una pregunta se envía el id del ejercicio, el autor sale del token
export interface QuestionInput {
  title: string;
  text: string;
  exercise: string;
}

// Al editar solo se pueden cambiar el título y el texto
export interface QuestionUpdate {
  title: string;
  text: string;
}

// Al leer, la API devuelve el ejercicio y el autor con populate
export interface Question {
  _id: string;
  title: string;
  text: string;
  exercise: Exercise;
  author: UserSummary;
  answers: Answer[];
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionsPage {
  questions: Question[];
  pagination: PageInfo;
}

// Filtros del listado: el texto (search) viene de ListParams y el ejercicio es el filtro propio
export interface QuestionListParams extends ListParams {
  exercise?: string;
}
