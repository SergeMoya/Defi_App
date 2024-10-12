import express from 'express';
import { getPriceFeeds, updatePriceFeed } from '../controllers/priceFeedController';

const router = express.Router();

router.get('/', getPriceFeeds);
router.put('/:symbol', updatePriceFeed);

export default router;