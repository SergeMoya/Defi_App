import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(__dirname, '..', '.env');

console.log('Attempting to load .env from:', envPath);

if (fs.existsSync(envPath)) {
  console.log('.env file found');
  dotenv.config({ path: envPath });
} else {
  console.log('.env file not found');
}

export const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/defi_dashboard',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret',
};

console.log('Loaded configuration:', config);