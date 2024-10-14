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

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', config.MONGODB_URI);
    
    if (!config.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the environment variables');
    }
    
    await mongoose.connect(config.MONGODB_URI);
    
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/price-feed', priceFeedRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/performance-analytics', performanceAnalyticsRoutes);

app.get('/', (req, res) => {
  res.send('DeFi Dashboard API');
});

// New test endpoint for price data
app.get('/api/test-price-data', async (req, res) => {
  try {
    console.log('Fetching price data...');
    const priceData = await getPriceData();
    console.log('Price data fetched:', priceData);
    res.json(priceData);
  } catch (error: unknown) {
    console.error('Error fetching price data:', error);
    if (error instanceof Error) {
      res.status(500).json({ message: 'Error fetching price data', error: error.message });
    } else {
      res.status(500).json({ message: 'An unknown error occurred while fetching price data' });
    }
  }
});

// Start the server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  } catch (error: unknown) {
    console.error('Failed to start the server:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

startServer();