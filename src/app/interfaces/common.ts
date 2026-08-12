/* eslint-disable @typescript-eslint/no-namespace */

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
