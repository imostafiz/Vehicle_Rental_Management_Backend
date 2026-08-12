import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import { validateRequest } from '../../middlewares/validateRequest';
import config from '../../../config';
import { login } from './auth.controller';

const router = Router();

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

router.post('/login', loginRateLimiter, validateRequest(loginSchema), login);

export default router;
