import express from 'express';
import { getTransactions, addTransaction } from '../controllers/transactionController';

const router = express.Router();

router.get('/:address', getTransactions as express.RequestHandler);
router.post('/:address', addTransaction as express.RequestHandler);

export default router;