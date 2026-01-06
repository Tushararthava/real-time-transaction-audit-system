'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transfer_controller_1 = require("../controllers/transfer.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const transfer_validator_1 = require("../validators/transfer.validator");
const router = (0, express_1.Router)();
// Transfer routes (all require authentication)
router.post('/transfer', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(transfer_validator_1.transferSchema), transfer_controller_1.TransferController.createTransfer);
router.get('/transactions', auth_middleware_1.authenticate, (0, validation_middleware_1.validate)(transfer_validator_1.transactionQuerySchema), transfer_controller_1.TransferController.getTransactions);
router.get('/balance', auth_middleware_1.authenticate, transfer_controller_1.TransferController.getBalance);
router.get('/users/search', auth_middleware_1.authenticate, transfer_controller_1.TransferController.searchUsers);
router.get('/payees/recent', auth_middleware_1.authenticate, transfer_controller_1.TransferController.getRecentPayees);
exports.default = router;
//# sourceMappingURL=transfer.routes.js.map