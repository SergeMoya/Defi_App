import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import portfolioRoutes from './routes/portfolio_route';
import priceFeedRoutes from './routes/priceFeed_route';
import transactionRoutes from './routes/transaction_route';
import authRoutes from './routes/auth_route';
import performanceAnalyticsRoutes from './routes/performanceAnalytics_route';
import { getPriceData } from './services/priceFeedService';

const app = express();

// Security middleware
app.use(cors());
app.use(express.json());
app.disable('x-powered-by'); // Remove Express header

// MongoDB connection with retry logic
const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      if (config.NODE_ENV === 'development') {
        console.log('Attempting to connect to MongoDB...');
      }
      
      await mongoose.connect(config.MONGODB_URI);
      
      console.log('Connected to MongoDB successfully');
      return;
    } catch (error) {
      retries -= 1;
      if (retries === 0) {
        console.error('Failed to connect to MongoDB after multiple attempts:', error);
        process.exit(1);
      }
      console.log(`Connection failed. Retrying... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/price-feed', priceFeedRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/performance-analytics', performanceAnalyticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DeFi Dashboard API' });
});

// Test endpoint with better error handling
app.get('/api/test-price-data', async (req, res) => {
  try {
    const priceData = await getPriceData();
    res.json(priceData);
  } catch (error) {
    console.error('Error fetching price data:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch price data',
      error: config.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
    });
  }
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (error) => {
      console.error('Unhandled Rejection:', error);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();