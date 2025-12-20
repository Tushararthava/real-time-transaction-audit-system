'use strict';

import { Router } from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All stats routes require authentication
router.use(authenticate);

// GET /api/stats/monthly - Get 6-month statistics
router.get('/monthly', StatsController.getMonthlyStats);

// GET /api/stats/weekly - Get weekly statistics
router.get('/weekly', StatsController.getWeeklyStats);

// GET /api/stats/daily - Get daily statistics
router.get('/daily', StatsController.getDailyStats);

// GET /api/stats/summary - Get summary statistics
router.get('/summary', StatsController.getSummaryStats);

export default router;
