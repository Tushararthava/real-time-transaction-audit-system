'use strict';

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.middleware';
import { signupSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/signup', authLimiter, validate(signupSchema), AuthController.signup);
router.post('/login', loginLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refresh);

// Protected routes 
router.get('/me', authenticate, AuthController.getMe);
router.post('/logout', authenticate, AuthController.logout);

export default router;
