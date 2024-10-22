import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  throw new Error('.env file not found! Please create one based on .env.example');
}

dotenv.config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

interface Config {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  JWT_SECRET: string;
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
};

// Validate configuration
if (!config.MONGODB_URI || !config.JWT_SECRET) {
  throw new Error('Invalid configuration: Missing required values');
}

// Only log configuration in development environment
if (config.NODE_ENV === 'development') {
  // Safely log configuration without sensitive data
  const safeConfig = {
    ...config,
    JWT_SECRET: '[REDACTED]',
    MONGODB_URI: '[REDACTED]',
  };
  console.log('Loaded configuration:', safeConfig);
}