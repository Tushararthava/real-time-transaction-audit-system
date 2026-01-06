'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const transfer_routes_1 = __importDefault(require("./transfer.routes"));
const stats_routes_1 = __importDefault(require("./stats.routes"));
const router = (0, express_1.Router)();
// Health check endpoint
router.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});
// Mount routes
router.use('/auth', auth_routes_1.default);
router.use('/', transfer_routes_1.default);
router.use('/stats', stats_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map