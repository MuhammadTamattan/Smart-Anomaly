import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../src/config/db.js';
import { seedSathyaDemoLogs } from '../src/config/seed_sathya_demo.js';

const run = async () => {
  try {
    console.log('[Runner] Connecting to MongoDB to seed Sri Sathya Saravana demo logs...');
    await connectDB();
    await seedSathyaDemoLogs();
    console.log('[Runner] Successfully seeded demo logs to database!');
    process.exit(0);
  } catch (err) {
    console.error('[Runner] Seed error:', err);
    process.exit(1);
  }
};

run();
