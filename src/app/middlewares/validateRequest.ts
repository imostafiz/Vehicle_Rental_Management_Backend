import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ObjectSchema } from 'joi';
import { ApiError } from '../errors/ApiError';

export const validateRequest = (schema: ObjectSchema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
    }

    req.body = value;
    next();
  };
};
