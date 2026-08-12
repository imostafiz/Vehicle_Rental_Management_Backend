import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../errors/ApiError';
import { verifyToken } from '../../helpers/jwtHelpers';
import { IAuthUser } from '../interfaces/common';

export const auth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'You are not authorized. Missing bearer token.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'You are not authorized. Missing token.');
    }

    const payload = verifyToken(token) as IAuthUser;
    if (!payload.id || !payload.email) {
      throw new ApiError(401, 'You are not authorized. Invalid token payload.');
    }

    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(401, 'You are not authorized. Invalid or expired token.'));
    }
  }
};
