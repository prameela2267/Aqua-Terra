const mongoose = require('mongoose');
const env = require('./env');

let mongoMemoryServerInstance = null;

const connectDB = async () => {
  // If a MongoDB URI is explicitly provided, attempt connection to it
  if (env.MONGODB_URI && env.MONGODB_URI.trim() !== '') {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${env.MONGODB_URI.split('@').pop()}`);
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[DB Warning] Failed to connect to configured MONGODB_URI: ${err.message}`);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
      console.log('[DB] Falling back to embedded MongoMemoryServer for standalone development...');
    }
  }

  // Standalone fallback: embedded MongoMemoryServer
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const uri = mongoMemoryServerInstance.getUri();
    console.log('[DB] MongoMemoryServer started successfully at:', uri);
    const conn = await mongoose.connect(uri);
    console.log(`[DB] Connected to Embedded MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error('[DB Error] Could not start embedded MongoDB or connect:', err.message);
    throw err;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
    console.log('[DB] Disconnected from MongoDB');
  } catch (err) {
    console.error('[DB Error] Disconnect error:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
