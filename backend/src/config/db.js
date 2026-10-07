import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri && (process.env.NODE_ENV === 'production' || process.env.RENDER)) {
      console.error('================================================================');
      console.error('[MongoDB Error] MONGODB_URI environment variable is missing!');
      console.error('On Render / cloud hosting, localhost MongoDB is not available.');
      console.error('Please configure MONGODB_URI in Render Dashboard -> Environment.');
      console.error('Example: mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/anomaly_detection');
      console.error('================================================================');
    }

    const uriToConnect = mongoUri || 'mongodb://127.0.0.1:27017/anomaly_detection';
    console.log(`[MongoDB] Connecting to database...`);
    const conn = await mongoose.connect(uriToConnect);
    console.log(`[MongoDB] Successfully Connected to ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    if (error.message.includes('ECONNREFUSED 127.0.0.1:27017')) {
      console.error('[MongoDB Tip] The server tried to connect to local MongoDB (127.0.0.1:27017), which is not available in cloud environments like Render. Please set MONGODB_URI in your Render Environment settings to a cloud MongoDB Atlas database.');
    }
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database.');
});

export default connectDB;