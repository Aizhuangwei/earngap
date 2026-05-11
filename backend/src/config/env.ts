// Env Validator - Zod schema for all environment variables
// Fail fast if production env is misconfigured
import { z } from 'zod';

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url().refine(
    (url) => url.startsWith('postgresql://'),
    'DATABASE_URL must be a PostgreSQL connection string'
  ),

  // Redis
  REDIS_URL: z.string().refine(
    (url) => url.startsWith('redis://') || url.startsWith('rediss://'),
    'REDIS_URL must be a Redis connection string'
  ),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().default('earngap_redis'),

  // Server
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // OpenClaw
  OPENCLAW_API_URL: z.string().url().optional(),
  OPENCLAW_API_KEY: z.string().optional(),

  // Next.js (for API proxy)
  NEXT_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  NEXT_PUBLIC_WS_URL: z.string().default('http://localhost:4000'),

  // Queue
  BULLMQ_PREFIX: z.string().default('earngap'),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Rate Limit
  RATE_LIMIT_WINDOW: z.coerce.number().default(15),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Monitoring
  SENTRY_DSN: z.string().url().optional(),

  // Feature Flags
  ENABLE_AI_PREDICT: z.coerce.boolean().default(false),
  ENABLE_BILLING: z.coerce.boolean().default(false),
  ENABLE_TRANSLATE: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  try {
    env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (i) => `  - ${i.path.join('.')}: ${i.message}`
      ).join('\n');
      console.error(`[Config] Environment validation failed:\n${issues}`);
      process.exit(1);
    }
    throw error;
  }
}

export function getEnv(): Env {
  if (!env) {
    return validateEnv();
  }
  return env;
}
