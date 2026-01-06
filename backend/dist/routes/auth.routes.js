'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const validation_middleware_1 = require("../middleware/validation.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_middleware_1 = require("../middleware/rateLimiter.middleware");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
// Public routes
router.post('/signup', rateLimiter_middleware_1.authLimiter, (0, validation_middleware_1.validate)(auth_validator_1.signupSchema), auth_controller_1.AuthController.signup);
router.post('/login', rateLimiter_middleware_1.loginLimiter, (0, validation_middleware_1.validate)(auth_validator_1.loginSchema), auth_controller_1.AuthController.login);
router.post('/refresh', (0, validation_middleware_1.validate)(auth_validator_1.refreshTokenSchema), auth_controller_1.AuthController.refresh);
// Protected routes 
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.getMe);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map