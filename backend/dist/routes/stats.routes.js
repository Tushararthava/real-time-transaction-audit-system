'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get('/monthly', auth_middleware_1.authenticate, stats_controller_1.StatsController.getMonthlyStats);
router.get('/weekly', auth_middleware_1.authenticate, stats_controller_1.StatsController.getWeeklyStats);
router.get('/daily', auth_middleware_1.authenticate, stats_controller_1.StatsController.getDailyStats);
router.get('/summary', auth_middleware_1.authenticate, stats_controller_1.StatsController.getSummaryStats);
exports.default = router;
//# sourceMappingURL=stats.routes.js.map