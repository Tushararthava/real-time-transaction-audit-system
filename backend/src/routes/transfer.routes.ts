'use strict';

import { Router } from 'express';
import { TransferController } from '../controllers/transfer.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { transferSchema, transactionQuerySchema } from '../validators/transfer.validator';

const router = Router();

// Transfer routes (all require authentication)
router.post('/transfer', authenticate, validate(transferSchema), TransferController.createTransfer);


router.get('/transactions', authenticate, validate(transactionQuerySchema), TransferController.getTransactions);


router.get('/balance', authenticate, TransferController.getBalance);


router.get('/users/search', authenticate, TransferController.searchUsers);


router.get('/payees/recent', authenticate, TransferController.getRecentPayees);

export default router;
