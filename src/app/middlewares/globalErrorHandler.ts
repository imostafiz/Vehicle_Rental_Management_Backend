import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import config from '../../config';

interface IPgError extends Error {
  code?: string;
  constraint?: string;
}

const POSTGRES_ERROR_MESSAGES: Record<string, (err: IPgError) => string> = {
  '23505': (err) => `Duplicate value violates unique constraint: ${err.constraint ?? 'unknown'}`,
  '23503': (err) => `Foreign key violation: ${err.constraint ?? 'unknown'}`,
  '23502': () => 'Not null constraint violation.',
  '23514': () => 'Check constraint violation.',
};

const isPgError = (err: Error): err is IPgError => {
  return typeof (err as IPgError).code === 'string';
};

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (isPgError(err) && err.code && POSTGRES_ERROR_MESSAGES[err.code]) {
    statusCode = 409;
    message = POSTGRES_ERROR_MESSAGES[err.code](err);
  } else {
    message = err.message || message;
  }

  const responseBody: Record<string, unknown> = {
    success: false,
    message,
    statusCode,
  };
  if (details !== undefined) responseBody.details = details;
  if (config.env !== 'production') responseBody.stack = err.stack;

  res.status(statusCode).json(responseBody);
};
