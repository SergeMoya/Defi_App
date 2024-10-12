import { Response } from 'express';
import Portfolio, { IPortfolio, IAsset } from '../models/Portfolio_model';
import { getPriceData } from '../services/priceFeedService';
import { UserRequest } from '../types';

export const getPortfolio = async (req: UserRequest, res: Response) => {
  try {
    console.log('getPortfolio called. req.user:', req.user);

    const userId = req.user?.id;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let portfolio = await Portfolio.findOne({ userId });
    console.log('Found portfolio:', portfolio);

    if (!portfolio) {
      console.log('Creating new portfolio for userId:', userId);
      portfolio = new Portfolio({
        userId,
        assets: [],
        totalValue: 0,
        totalChange24h: 0,
      });
      await portfolio.save();
      console.log('New portfolio created:', portfolio);
    }

    res.json(portfolio);
  } catch (error) {
    console.error('Error in getPortfolio:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePortfolio = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { assets } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!Array.isArray(assets)) {
      return res.status(400).json({ message: 'Invalid assets data' });
    }

    const priceData = await getPriceData();
    let totalValue = 0;
    let totalChange24h = 0;

    const updatedAssets: IAsset[] = assets.map((asset) => {
      const price = priceData[asset.symbol.toLowerCase()]?.usd || 0;
      const change24h = priceData[asset.symbol.toLowerCase()]?.usd_24h_change || 0;
      const value = asset.amount * price;

      totalValue += value;
      totalChange24h += value * (change24h / 100);

      return {
        name: asset.name,
        symbol: asset.symbol,
        amount: asset.amount,
        value,
        change24h,
      };
    });

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { userId },
      {
        assets: updatedAssets,
        totalValue,
        totalChange24h,
        lastUpdated: new Date(),
      },
      { new: true, upsert: true }
    );

    res.json(updatedPortfolio);
  } catch (error) {
    console.error('Error in updatePortfolio:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addAsset = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, symbol, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!name || !symbol || amount === undefined) {
      return res.status(400).json({ message: 'Missing required asset information' });
    }

    const priceData = await getPriceData();
    const price = priceData[symbol.toLowerCase()]?.usd || 0;
    const change24h = priceData[symbol.toLowerCase()]?.usd_24h_change || 0;
    const value = amount * price;

    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.assets.push({
      name,
      symbol,
      amount,
      value,
      change24h,
    });

    portfolio.totalValue += value;
    portfolio.totalChange24h += value * (change24h / 100);
    portfolio.lastUpdated = new Date();

    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    console.error('Error in addAsset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const removeAsset = async (req: UserRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { symbol } = req.params;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const portfolio = await Portfolio.findOne({ userId });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const assetIndex = portfolio.assets.findIndex((asset) => asset.symbol === symbol);

    if (assetIndex === -1) {
      return res.status(404).json({ message: 'Asset not found in portfolio' });
    }

    const removedAsset = portfolio.assets[assetIndex];
    portfolio.totalValue -= removedAsset.value;
    portfolio.totalChange24h -= removedAsset.value * (removedAsset.change24h / 100);
    portfolio.assets.splice(assetIndex, 1);
    portfolio.lastUpdated = new Date();

    await portfolio.save();

    res.json(portfolio);
  } catch (error) {
    console.error('Error in removeAsset:', error);
    res.status(500).json({ message: 'Server error' });
  }
};