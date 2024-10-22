// src/services/apiService.ts

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import rateLimit from 'axios-rate-limit';
import NodeCache from 'node-cache';
import { CoinData, CoinHistory } from './priceFeedService';

// Configure cache with different TTLs for different endpoints
const cache = new NodeCache({
  stdTTL: 60, // Default TTL in seconds
  checkperiod: 120, // Cleanup interval
  useClones: false,
});

// Rate limit configuration
const MAX_REQUESTS_PER_SECOND = 10;
const MAX_REQUESTS_PER_MINUTE = 50;

// Configure axios with rate limiting
const http = rateLimit(axios.create({
  baseURL: 'https://api.coingecko.com/api/v3',
  timeout: 10000,
}), {
  maxRequests: MAX_REQUESTS_PER_SECOND,
  perMilliseconds: 1000,
});

// Retry configuration
const MAX_RETRIES = 3;
const MIN_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

interface ApiConfig extends AxiosRequestConfig {
  cacheKey?: string;
  cacheTTL?: number;
  bypassCache?: boolean;
}

// Custom retry logic with exponential backoff
async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  minDelay: number = MIN_RETRY_DELAY,
  maxDelay: number = MAX_RETRY_DELAY
): Promise<T> {
  let lastError: Error = new Error('Operation failed after maximum retries');
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error(String(error));
      }
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const delay = Math.min(
          Math.pow(2, attempt) * minDelay + Math.random() * 1000,
          maxDelay
        );
        
        console.log(
          `Attempt ${attempt + 1} failed. Retrying in ${delay}ms. ${retries - attempt - 1} retries left.`
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw lastError;
    }
  }
  
  throw lastError;
}

class EnhancedApiService {
  private static instance: EnhancedApiService;
  private requestCount: number = 0;
  private lastResetTime: number = Date.now();

  private constructor() {
    // Reset request count every minute
    setInterval(() => {
      this.requestCount = 0;
      this.lastResetTime = Date.now();
    }, 60000);
  }

  static getInstance(): EnhancedApiService {
    if (!EnhancedApiService.instance) {
      EnhancedApiService.instance = new EnhancedApiService();
    }
    return EnhancedApiService.instance;
  }

  private async makeRequest<T>(config: ApiConfig): Promise<T> {
    // Check rate limits
    if (this.requestCount >= MAX_REQUESTS_PER_MINUTE) {
      const timeToWait = 60000 - (Date.now() - this.lastResetTime);
      throw new Error(`Rate limit exceeded. Please wait ${timeToWait}ms`);
    }

    // Check cache first
    if (config.cacheKey && !config.bypassCache) {
      const cachedData = cache.get<T>(config.cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const response = await retry(async () => {
      const result = await http.request<T>(config);
      this.requestCount++;
      
      // Cache successful response
      if (config.cacheKey && config.cacheTTL) {
        cache.set(config.cacheKey, result.data, Math.floor(config.cacheTTL));
      }
      
      return result.data;
    });

    return response;
  }

  async getTopCoins(count: number = 10): Promise<CoinData[]> {
    const cacheKey = `topCoins_${count}`;
    
    return this.makeRequest<CoinData[]>({
      method: 'GET',
      url: '/coins/markets',
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: count,
        page: 1,
        sparkline: false,
      },
      cacheKey,
      cacheTTL: 300, // Cache for 5 minutes
    });
  }

  async getCoinHistory(coinId: string, days: number = 1): Promise<CoinHistory> {
    const cacheKey = `coinHistory_${coinId}_${days}`;
    
    return this.makeRequest<CoinHistory>({
      method: 'GET',
      url: `/coins/${coinId}/market_chart`,
      params: {
        vs_currency: 'usd',
        days: days.toString(),
      },
      cacheKey,
      cacheTTL: 300, // Cache for 5 minutes
    });
  }

  clearCache(): void {
    cache.flushAll();
  }

  getCacheStats(): NodeCache.Stats {
    return cache.getStats();
  }
}

export const apiService = EnhancedApiService.getInstance();