import { AppError } from './app.error.js';

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(message = 'Datos inválidos') {
    super(message);
  }
}
