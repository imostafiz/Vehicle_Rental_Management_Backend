import { Request, Response } from 'express';
import { catchAsync } from '../../../shared/catchAsync';
import { sendResponse } from '../../../shared/sendResponse';
import { loginService } from './auth.service';

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await loginService(email, password);
  sendResponse(res, {
    statusCode: 200,
    message: 'Login successful.',
    data: result,
  });
});
