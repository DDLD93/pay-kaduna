import config from './config/env';
import { createApp } from './app';
import logger from './middleware/logger';

/**
 * Application Entry Point
 */
async function main(): Promise<void> {
  try {
    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        env: config.env,
        docs: `http://localhost:${config.port}/docs`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start application
main().catch((error) => {
  logger.error('Fatal error in main', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  process.exit(1);
});
