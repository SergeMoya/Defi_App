// src/services/priceFeedService.ts

import { apiService } from './apiService';

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
  try {
    return await apiService.getTopCoins(count);
  } catch (error) {
    console.error('Error fetching top coins:', error);
    throw error;
  }
};

export const getCoinHistory = async (coinId: string, days: number = 1): Promise<CoinHistory> => {
  try {
    return await apiService.getCoinHistory(coinId, days);
  } catch (error) {
    console.error(`Error fetching coin history for ${coinId}:`, error);
    throw error;
  }
};

export const getPriceData = async (): Promise<CoinData[]> => {
  try {
    return await apiService.getTopCoins(10);
  } catch (error) {
    console.error('Error fetching price data:', error);
    throw error;
  }
};

// Helper function to clear cache if needed
export const clearPriceCache = (): void => {
  apiService.clearCache();
};

// Helper function to get cache statistics
export const getCacheStats = (): any => {
  return apiService.getCacheStats();
};