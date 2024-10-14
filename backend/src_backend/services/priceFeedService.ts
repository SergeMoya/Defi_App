import axios from 'axios';
import { getCachedData, setCachedData } from '../cache';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface CoinHistory {
  prices: [number, number][];
}

export const getTopCoins = async (count: number = 10): Promise<CoinData[]> => {
  const cacheKey = `topCoins_${count}`;
  const cachedData = getCachedData<CoinData[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets`, {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false,
      },
    });
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching top coins:', error);
    throw error;
  }
};

export const getCoinHistory = async (coinId: string, days: number = 1): Promise<CoinHistory> => {
  const cacheKey = `coinHistory_${coinId}_${days}`;
  const cachedData = getCachedData<CoinHistory>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${coinId}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
      },
    });
    const data = response.data;
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Error fetching coin history for ${coinId}:`, error);
    throw error;
  }
};

export const getPriceData = async (): Promise<CoinData[]> => {
  return getTopCoins(10);
};