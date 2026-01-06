'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = void 0;
const logger_1 = require("../config/logger");
const ApiError_1 = __importDefault(require("../utils/ApiError"));
const env_1 = require("../config/env");
const errorHandler = (err, req, res, _next) => {
    let error = err;
    // Convert non-ApiError to ApiError
    if (!(error instanceof ApiError_1.default)) {
        const statusCode = 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError_1.default(statusCode, message, false, err.stack);
    }
    const { statusCode, message } = error;
    // Log error
    logger_1.logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);
    if (env_1.env.isDevelopment) {
        logger_1.logger.error(err.stack);
    }
    // Send error response
    const response = {
        success: false,
        statusCode,
        message,
        ...(env_1.env.isDevelopment && { stack: err.stack }),
    };
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
//404 Not Found handler
const notFound = (req, _res, next) => {
    const error = ApiError_1.default.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFound = notFound;
//# sourceMappingURL=error.middleware.js.map