// src/routes/priceFeed_route.ts

import express from 'express';
import { getPriceFeeds } from '../controllers/priceFeedController';
import { authMiddleware } from '../middleware/auth';
import { UserRequest } from '../types'; 

const router = express.Router();

// Apply authMiddleware to all routes
router.use((req, res, next) => {
  authMiddleware(req as UserRequest, res, next);
});

// Helper function to handle async routes
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply the asyncHandler to getPriceFeeds
router.get('/', asyncHandler(getPriceFeeds));

export default router;