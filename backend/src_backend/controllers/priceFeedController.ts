// src/controllers/priceFeedController.ts

import { Request, Response } from 'express';
import { getTopCoins, getCoinHistory, CoinData } from '../services/priceFeedService';
import { getCachedData, setCachedData } from '../cache';

const CACHE_KEY = 'priceFeeds';

export const getPriceFeeds = async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    
    const cachedData = getCachedData<CoinData[]>(CACHE_KEY);
    if (cachedData) {
      return res.json(cachedData);
    }

    const coins = await getTopCoins(count);
    
    const priceFeeds = await Promise.all(coins.map(async (coin: CoinData) => {
      const history = await getCoinHistory(coin.id);
      return {
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        priceHistory: history.prices.map(([timestamp, price]) => ({ timestamp, price })),
      };
    }));

    setCachedData(CACHE_KEY, priceFeeds);
    res.json(priceFeeds);
  } catch (error) {
    console.error('Error in getPriceFeeds:', error);
    res.status(500).json({ message: 'Error fetching price feeds' });
  }
};