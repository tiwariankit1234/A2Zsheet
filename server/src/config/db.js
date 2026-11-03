import mongoose from 'mongoose';
import env from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(uri = env.mongoUri) {
  mongoose.connection.on('disconnected', () => {
    if (!env.isTest) console.warn('[db] MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => console.info('[db] MongoDB reconnected'));

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  if (!env.isTest) console.info(`[db] Connected to MongoDB (${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

export const isDbReady = () => mongoose.connection.readyState === 1;
