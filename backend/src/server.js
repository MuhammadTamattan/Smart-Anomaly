import app from './app.js';
import connectDB from './config/db.js';
import { seedDatabase } from './config/seed.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`[Server] Smart Anomaly Detection API running dynamically on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Fatal startup failure:', err.message);
    process.exit(1);
  }
};

startServer();
