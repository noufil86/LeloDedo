import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as rateLimit from 'express-rate-limit';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private loginLimiter = rateLimit.default({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => true, // Disable for development
  });

  private messageLimiter = rateLimit.default({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 messages per minute
    message: 'Too many messages, please slow down',
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => true, // Disable for development
  });

  use(req: Request, res: Response, next: NextFunction) {
    // Rate limiting disabled for development
    next();
  }
}
