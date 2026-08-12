/* eslint-disable @typescript-eslint/no-namespace */
export interface IAuthUser {
  id: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
