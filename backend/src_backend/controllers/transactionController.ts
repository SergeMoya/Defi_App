import { Request, Response } from 'express';
import Transaction from '../models/Transaction_mode';
import User from '../models/User';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const user = await User.findOne({ address });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ user: user._id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
};

export const addTransaction = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { type, asset, amount, price } = req.body;

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transaction = await Transaction.create({
      user: user._id,
      type,
      asset,
      amount,
      price,
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Error adding transaction', error });
  }
};