import { Request, Response } from 'express';
import Portfolio from '../models/Portfolio_model';
import User from '../models/User';

export const getPortfolio = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    let user = await User.findOne({ address });
    if (!user) {
      user = await User.create({ address });
    }

    let portfolio = await Portfolio.findOne({ user: user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        user: user._id,
        assets: [],
        totalValue: 0,
      });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching portfolio', error });
  }
};

export const updatePortfolio = async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { assets, totalValue } = req.body;

    const user = await User.findOne({ address });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const portfolio = await Portfolio.findOneAndUpdate(
      { user: user._id },
      { assets, totalValue },
      { new: true, upsert: true }
    );

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Error updating portfolio', error });
  }
};