import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
export declare const errorHandler: (err: Error | ApiError, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFound: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map