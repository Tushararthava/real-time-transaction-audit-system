'use strict';

import { Router } from 'express';
import authRoutes from './auth.routes';
import transferRoutes from './transfer.routes';
import statsRoutes from './stats.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/', transferRoutes); // Mounted at root for /transfer, /transactions, /balance endpoints
router.use('/stats', statsRoutes);

export default router;
