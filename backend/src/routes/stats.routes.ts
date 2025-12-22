'use strict';

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();


router.get('/monthly', authenticate, StatsController.getMonthlyStats);


router.get('/weekly', authenticate, StatsController.getWeeklyStats);


router.get('/daily', authenticate, StatsController.getDailyStats);


router.get('/summary', authenticate, StatsController.getSummaryStats);

export default router;
