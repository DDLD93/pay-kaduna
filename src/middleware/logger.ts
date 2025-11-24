import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import config from '../config/env';

/**
 * Configure Winston logger with structured JSON logs
 */
const logger = winston.createLogger({
  level: config.env === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'paykaduna-integration',
  },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: config.env === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),
  ],
});

// Add file transport in production
if (config.env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export default logger;

/**
 * Request logging middleware
 * Logs HTTP requests with structured JSON format
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  // Log request
  logger.debug('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
}
