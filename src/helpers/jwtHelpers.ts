import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import { IAuthUser } from '../app/interfaces/common';

export const generateToken = (payload: IAuthUser): string => {
  const options: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): IAuthUser => {
  return jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as IAuthUser;
};
