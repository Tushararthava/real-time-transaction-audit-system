'use strict';

import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { transferSchema, transactionQuerySchema } from '../validators/transfer.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Transfer routes
router.post('/transfer', validate(transferSchema), TransferController.createTransfer);

// Transaction history
router.get('/transactions', validate(transactionQuerySchema), TransferController.getTransactions);

// Balance
router.get('/balance', TransferController.getBalance);

// User search
router.get('/users/search', TransferController.searchUsers);

// Recent payees
router.get('/payees/recent', TransferController.getRecentPayees);

export default router;
