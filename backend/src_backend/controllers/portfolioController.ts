import { Response } from 'express';
import Portfolio, { IPortfolio, IAsset } from '../models/Portfolio_model';
import { getPriceData, PriceData } from '../services/priceFeedService';
import { UserRequest } from '../types';

const createSamplePortfolio = (priceData: PriceData): IAsset[] => {
  return Object.values(priceData)
    .slice(0, 5)
    .map(coin => ({
      name: coin.name,
      symbol: coin.symbol,
      amount: parseFloat((Math.random() * 10).toFixed(4)), // Random amount between 0 and 10
      value: 0,
      change24h: 0,
      image: coin.image,
    }));
};

const updateAssetPrices = (assets: IAsset[], priceData: PriceData): IAsset[] => {
  return assets.map(asset => {
    const coinData = priceData[asset.symbol.toLowerCase()];
    if (coinData) {
      return {
        ...asset,
        value: asset.amount * coinData.usd,
        change24h: coinData.usd_24h_change,
        image: coinData.image,
      };
    }
    return asset;
  });
};

export const getPortfolio = async (req: UserRequest, res: Response) => {
  try {
    console.log('getPortfolio called. req.user:', req.user);

    const userId = req.user?.id;
    console.log('Extracted userId:', userId);

    if (!userId) {
      console.log('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const priceData = await getPriceData();
    console.log('Fetched price data:', priceData);

    let portfolio = await Portfolio.findOne({ userId });
    console.log('Found portfolio:', portfolio);

    if (!portfolio) {
      console.log('Creating new portfolio for userId:', userId);
      const sampleAssets = createSamplePortfolio(priceData);
      const updatedAssets = updateAssetPrices(sampleAssets, priceData);
      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalChange24h = updatedAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);

      portfolio = new Portfolio({
        userId,
        assets: updatedAssets,
        totalValue,
        totalChange24h,
      });
      await portfolio.save();
      console.log('New portfolio created with sample assets:', portfolio);
    } else {
      console.log('Updating existing portfolio with current prices');
      const updatedAssets = updateAssetPrices(portfolio.assets, priceData);
      const totalValue = updatedAssets.reduce((sum, asset) => sum + asset.value, 0);
      const totalChange24h = updatedAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0);

      portfolio.assets = updatedAssets;
      portfolio.totalValue = totalValue;
      portfolio.totalChange24h = totalChange24h;
      portfolio.lastUpdated = new Date();
      await portfolio.save();
      console.log('Portfolio updated with current prices:', portfolio);
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