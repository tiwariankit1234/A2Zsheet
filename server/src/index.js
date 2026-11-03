import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import { seedIfEmpty } from './services/dataService.js';

async function main() {
  await connectDB();
  if (env.autoSeed) {
    const seeded = await seedIfEmpty({ log: (m) => console.info(`[seed] ${m}`) });
    if (!seeded) console.info('[seed] Problems already present - skipping auto-seed (run "npm run seed" to refresh).');
  }

  const server = createApp().listen(env.port, () => {
    console.info(`[server] API listening on http://localhost:${env.port}/api`);
  });

  const shutdown = async (signal) => {
    console.info(`[server] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] Failed to start:', err.message);
  if (/ECONNREFUSED|Server selection/i.test(err.message)) {
    console.error(`[server] Could not reach MongoDB at ${env.mongoUri}. Is MongoDB running? See README.md.`);
  }
  process.exit(1);
});
