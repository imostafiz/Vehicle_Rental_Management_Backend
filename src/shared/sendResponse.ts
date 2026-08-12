import { Response } from 'express';

interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface IResponseOptions<T> {
  success?: boolean;
  statusCode: number;
  message: string;
  meta?: IMeta;
  data?: T;
}

export const sendResponse = <T>(res: Response, options: IResponseOptions<T>): void => {
  const { success = true, statusCode, message, meta, data } = options;
  const body: Record<string, unknown> = { success, message };
  if (meta !== undefined) body.meta = meta;
  if (data !== undefined) body.data = data;
  res.status(statusCode).json(body);
};
