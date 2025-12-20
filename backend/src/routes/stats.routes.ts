'use strict';

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// GET /api/stats/monthly - Get 6-month statistics (requires authentication)
router.get('/monthly', authenticate, StatsController.getMonthlyStats);

// GET /api/stats/weekly - Get weekly statistics
router.get('/weekly', authenticate, StatsController.getWeeklyStats);

// GET /api/stats/daily - Get daily statistics
router.get('/daily', authenticate, StatsController.getDailyStats);

// GET /api/stats/summary - Get summary statistics
router.get('/summary', authenticate, StatsController.getSummaryStats);

export default router;
