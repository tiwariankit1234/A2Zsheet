// Usage: npm run seed   (reads MONGODB_URI from server/.env)
import { connectDB, disconnectDB } from '../config/db.js';
import { seedDatabase } from '../services/dataService.js';
import { validateSheet } from './validateData.js';
import { loadSheet } from '../services/dataService.js';

async function run() {
  const { errors } = validateSheet(await loadSheet());
  if (errors.length) {
    console.error(`Dataset has ${errors.length} validation error(s); run "npm run validate:data". Aborting seed.`);
    process.exit(1);
  }
  await connectDB();
  await seedDatabase({ log: console.info });
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('Seed failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
