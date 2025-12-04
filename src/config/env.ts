import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  PK_BASE_URL_TEST: z.string().url(),
  PK_BASE_URL_PROD: z.string().url(),
  PK_API_KEY: z.string().min(1, 'PK_API_KEY is required'),
  PK_ENGINE_CODE: z.string().min(1, 'PK_ENGINE_CODE is required'),
  PK_WEBHOOK_SECRET_KEY: z.string(),
  DOMAIN_URL: z.string().url().optional(),
});

type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
      throw new Error(`Invalid environment variables:\n${missingVars}`);
    }
    throw error;
  }
}

const env = validateEnv();

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  domainUrl: env.DOMAIN_URL,
  payKaduna: {
    baseUrl: env.NODE_ENV === 'production' ? env.PK_BASE_URL_PROD : env.PK_BASE_URL_TEST,
    apiKey: env.PK_API_KEY,
    engineCode: env.PK_ENGINE_CODE,
    webhookSecretKey: env.PK_WEBHOOK_SECRET_KEY,
  },
} as const;

export default config;
