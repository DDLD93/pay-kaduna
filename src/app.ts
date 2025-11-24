import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import config from './config/env';
import routes from './routes';
import webhookRoutes from './routes/webhook.routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import logger from './middleware/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // ============================================================================
  // Middleware
  // ============================================================================

  // CORS
  app.use(cors());

  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // ============================================================================
  // Health Check
  // ============================================================================

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'paykaduna-integration',
      timestamp: new Date().toISOString(),
    });
  });

  // ============================================================================
  // API Routes
  // ============================================================================

  app.use('/v1', routes);

  // Webhook routes (mounted at /api/v1/paykaduna)
  app.use('/api/v1/paykaduna', webhookRoutes);

  // ============================================================================
  // Swagger Documentation
  // ============================================================================

  // Load OpenAPI YAML file
  const swaggerYamlPath = path.resolve(process.cwd(), 'docs/swagger.yaml');
  const swaggerYamlContent = fs.readFileSync(swaggerYamlPath, 'utf8');
  const swaggerSpec = yaml.load(swaggerYamlContent) as any;

  // Update server URLs dynamically based on config
  if (swaggerSpec.servers && swaggerSpec.servers.length > 0) {
    if (config.domainUrl) {
      // Use DOMAIN_URL if provided
      swaggerSpec.servers[0].url = config.domainUrl;
      // Update or add additional server entries if needed
      if (swaggerSpec.servers.length > 1) {
        swaggerSpec.servers[1].url = config.domainUrl;
      }
    } else {
      // Fallback to localhost if DOMAIN_URL not provided
      swaggerSpec.servers[0].url = `http://localhost:${config.port}`;
    }
  }

  // Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PayKaduna API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: `Cannot ${req.method} ${req.path}`,
        statusCode: 404,
      },
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  logger.info('Express application configured', {
    port: config.port,
    env: config.env,
  });

  return app;
}
