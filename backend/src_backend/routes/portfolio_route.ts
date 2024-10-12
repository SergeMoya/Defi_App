import express from 'express';
import { getPortfolio, updatePortfolio } from '../controllers/portfolioController';

const router = express.Router();

router.get('/:address', getPortfolio as express.RequestHandler);
router.put('/:address', updatePortfolio as express.RequestHandler);

export default router;