import 'dotenv/config';

const toBool = (v, fallback) => (v === undefined ? fallback : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/a2z_sheet',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  autoSeed: toBool(process.env.AUTO_SEED, true),
};

env.isProd = env.nodeEnv === 'production';
env.isTest = env.nodeEnv === 'test';

if (!env.jwtSecret) {
  if (env.isProd) {
    throw new Error('JWT_SECRET must be set in production. See server/.env.example');
  }
  // Development-only fallback so the app runs out of the box. Never used in production.
  env.jwtSecret = 'dev-only-insecure-secret-change-me';
  if (!env.isTest) console.warn('[config] JWT_SECRET not set - using an insecure development secret.');
}

export default env;
