import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import portfolioRoutes from './routes/portfolio_route';
import priceFeedRoutes from './routes/priceFeed_route';
import transactionRoutes from './routes/transaction_route';
import authRoutes from './routes/auth_route';

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

app.get('/', (req, res) => {
  res.send('DeFi Dashboard API');
});

// Start the server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();