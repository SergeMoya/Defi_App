import { Request, Response } from 'express';
import PriceFeed from '../models/PriceFeed_model';

export const getPriceFeeds = async (req: Request, res: Response) => {
  try {
    const priceFeeds = await PriceFeed.find();
    res.json(priceFeeds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching price feeds', error });
  }
};

export const updatePriceFeed = async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const updateData = req.body;

    const priceFeed = await PriceFeed.findOneAndUpdate(
      { symbol },
      { ...updateData, lastUpdated: new Date() },
      { new: true, upsert: true }
    );

    res.json(priceFeed);
  } catch (error) {
    res.status(500).json({ message: 'Error updating price feed', error });
  }
};