import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import config from './config';
import routes from './app/routes';
import { globalErrorHandler } from './app/middlewares/globalErrorHandler';
import { ApiError } from './app/errors/ApiError';

const app: Application = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  `/${config.upload.path}`,
  express.static(path.resolve(process.cwd(), config.upload.path), {
    fallthrough: true,
  }),
);

app.use('/api/v1', routes);

app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(globalErrorHandler);

export default app;
