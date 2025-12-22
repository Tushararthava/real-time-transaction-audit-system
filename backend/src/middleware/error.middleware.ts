'use strict';

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import ApiError from '../utils/ApiError';
import { env } from '../config/env';




export const errorHandler = (
    err: Error | ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    let error = err;

    // Convert non-ApiError to ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    const { statusCode, message } = error as ApiError;

    // Log error
    logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);
    if (env.isDevelopment) {
        logger.error(err.stack);
    }

    // Send error response
    const response = {
        success: false,
        statusCode,
        message,
        ...(env.isDevelopment && { stack: err.stack }),
    };

    res.status(statusCode).json(response);
};

//404 Not Found handler
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
    const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};
