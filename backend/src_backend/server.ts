import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import portfolioRoutes from './routes/portfolio_route';
import priceFeedRoutes from './routes/priceFeed_route';
import transactionRoutes from './routes/transaction_route';
import authRoutes from './routes/auth_route';
import performanceAnalyticsRoutes from './routes/performanceAnalytics_route';
import { setupErrorHandling } from './middleware/errorHandler';

const app = express();

// Enhanced logging middleware
const loggerMiddleware = morgan((tokens, req, res) => {
  return JSON.stringify({
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    responseTime: `${tokens['response-time'](req, res)} ms`,
    timestamp: new Date().toISOString(),
    userAgent: tokens['user-agent'](req, res),
  });
});

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(15 * 60 / 60)
    });
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS Configuration
// Replace your existing corsOptions with this:
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.130:3000',
      'http://127.0.0.1:3000',
      'https://defi-dashboard-gold.vercel.app'
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600
};

// Add this after your existing middleware setup but before routes
app.options('*', cors(corsOptions));

// Additional headers middleware
const setCustomHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
  }
  
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.status(200).json({
      status: 'success',
      message: 'Preflight request successful'
    });
    return;
  }

  next();
};

// MongoDB connection with enhanced retry logic
const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      if (config.NODE_ENV === 'development') {
        console.log('[MongoDB] Attempting to connect to:', config.MONGODB_URI);
      }
      
      await mongoose.connect(config.MONGODB_URI);
      console.log(`[MongoDB] Connected successfully in ${config.NODE_ENV} mode`);
      return;
    } catch (error) {
      retries -= 1;
      console.error('[MongoDB] Connection error:', error);
      
      if (retries === 0) {
        console.error('[MongoDB] Failed to connect after multiple attempts');
        process.exit(1);
      }
      
      const waitTime = 5000 * (6 - retries);
      console.log(`[MongoDB] Retrying in ${waitTime/1000}s... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Basic Middleware Setup (Order is important)
app.use(cors(corsOptions));
app.use(express.json());
app.use(loggerMiddleware);
app.disable('x-powered-by');
app.use(setCustomHeaders);

// Apply rate limiting to all API routes
app.use('/api/', limiter);

// API Root
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'DeFi Dashboard API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      portfolio: '/api/portfolio',
      priceFeed: '/api/price-feed',
      transactions: '/api/transactions',
      performanceAnalytics: '/api/performance-analytics'
    }
  });
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Debug middleware for test endpoints
app.use('/api/test/*', (req: Request, res: Response, next: NextFunction) => {
  console.log('[Debug] Test endpoint accessed:', {
    path: req.path,
    method: req.method,
    headers: req.headers
  });
  next();
});

// Test endpoint for development
app.get('/api/test/price-feed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[PriceFeed Test] Starting price feed test');
    const mockData = [
      {
        id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: 68239,
        price_change_percentage_24h: 1.65071,
        market_cap: 1349344685657,
        total_volume: 22677042905,
        image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
        priceHistory: Array.from({ length: 24 }, (_, i) => ({
          timestamp: Date.now() - (23 - i) * 3600000,
          price: 68000 + Math.random() * 2000
        }))
      }
    ];

    res.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      data: mockData
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/price-feed', priceFeedRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/performance-analytics', performanceAnalyticsRoutes);

// Setup error handling (should be last)
setupErrorHandling(app);

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('[Server] Initiating graceful shutdown...');
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('[Server] Error during graceful shutdown:', error);
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
      console.log(`[Server] Running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });

    // Enhanced error handling
    process.on('unhandledRejection', (error: Error) => {
      console.error('[Server] Unhandled Rejection:', error);
      server.close(() => {
        console.error('[Server] Shutting down due to unhandled rejection');
        process.exit(1);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('[Server] Uncaught Exception:', error);
      server.close(() => {
        console.error('[Server] Shutting down due to uncaught exception');
        process.exit(1);
      });
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

// Environment-specific server start
if (process.env.NODE_ENV !== 'production') {
  startServer();
} else {
  // In production (Vercel), we only export the app
  connectDB().catch(console.error);
}

export default app;