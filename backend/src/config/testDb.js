import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const testConnection = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/anomaly_detection';

  console.log('----------------------------------------------------');
  console.log('Testing MongoDB Connection...');
  console.log(`URI: ${uri}`);
  console.log('----------------------------------------------------');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connection Successful!');
    console.log(`• Host:      ${conn.connection.host}`);
    console.log(`• Port:      ${conn.connection.port}`);
    console.log(`• Database:  ${conn.connection.name}`);
    console.log(`• Status:    ${conn.connection.readyState === 1 ? 'Connected (Ready)' : 'State ' + conn.connection.readyState}`);

    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`• Collections found (${collections.length}):`);
    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name} (${count} documents)`);
    }

    console.log('----------------------------------------------------');
    console.log('Backend is fully ready to communicate with MongoDB.');
    console.log('----------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed!');
    console.error(`Error: ${error.message}`);
    console.log('\nTroubleshooting Tips:');
    if (uri.startsWith('mongodb+srv://')) {
      console.log('1. Ensure your IP address is whitelisted in MongoDB Atlas (Network Access -> Add IP -> 0.0.0.0/0 or Current IP).');
      console.log('2. Verify your MongoDB Atlas username and password in .env.');
      console.log('3. If your password has special characters like @, #, $, encode them (e.g., encodeURIComponent).');
    } else {
      console.log('1. Ensure MongoDB service is running locally on your computer.');
      console.log('2. If MongoDB is installed as a Windows service, run: net start MongoDB in an Administrator terminal.');
      console.log('3. Check that port 27017 is accessible on 127.0.0.1.');
    }
    console.log('----------------------------------------------------');
    process.exit(1);
  }
};

testConnection();
