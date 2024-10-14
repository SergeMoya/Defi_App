// src/services/demoUserService.ts

import Portfolio from '../models/Portfolio_model';
import PerformanceAnalytics from '../models/PerformanceAnalytics_model';
import { IAsset } from '../models/Portfolio_model';
import { IPerformanceData } from '../models/PerformanceAnalytics_model';
import { getPriceData } from './priceFeedService';

const DEMO_USER_ID = 'demo-user';

interface DemoAsset extends IAsset {
  historicalPrices: number[];
}

export const createDemoUser = async () => {
  try {
    console.log('Creating demo user...');
    const priceData = await getPriceData();
    const demoAssets = generateDemoAssets(priceData);
    const performanceData = generatePerformanceData(demoAssets);

    // Create demo portfolio
    const portfolio = new Portfolio({
      userId: DEMO_USER_ID,
      assets: demoAssets.map(asset => ({
        name: asset.name,
        symbol: asset.symbol,
        amount: asset.amount,
        value: asset.value,
        change24h: asset.change24h,
        image: asset.image,
      })),
      totalValue: demoAssets.reduce((sum, asset) => sum + asset.value, 0),
      totalChange24h: demoAssets.reduce((sum, asset) => sum + (asset.value * asset.change24h / 100), 0),
      lastUpdated: new Date(),
    });

    // Create demo performance analytics
    const performanceAnalytics = new PerformanceAnalytics({
      userId: DEMO_USER_ID,
      data: performanceData,
    });

    await portfolio.save();
    await performanceAnalytics.save();

    console.log('Demo user created successfully');
    return { portfolio, performanceAnalytics };
  } catch (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
};

const generateDemoAssets = (priceData: any): DemoAsset[] => {
  console.log('Generating demo assets...');
  return Object.values(priceData).slice(0, 5).map((coin: any) => ({
    name: coin.name,
    symbol: coin.symbol,
    amount: parseFloat((Math.random() * 10).toFixed(4)),
    value: coin.usd * parseFloat((Math.random() * 10).toFixed(4)),
    change24h: coin.usd_24h_change,
    image: coin.image,
    historicalPrices: generateHistoricalPrices(coin.usd, 365),
  }));
};

const generateHistoricalPrices = (currentPrice: number, days: number): number[] => {
  const prices = [currentPrice];
  for (let i = 1; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.05; // Daily change between -2.5% and 2.5%
    prices.unshift(prices[0] * (1 + change));
  }
  return prices;
};

const generatePerformanceData = (assets: DemoAsset[]): IPerformanceData[] => {
  console.log('Generating performance data...');
  const performanceData: IPerformanceData[] = [];
  const days = assets[0].historicalPrices.length;

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));

    const dailyData: IPerformanceData = {
      date,
      totalValue: 0,
      dailyReturn: 0,
      assets: {},
    };

    assets.forEach(asset => {
      const value = asset.amount * asset.historicalPrices[i];
      dailyData.totalValue += value;
      dailyData.assets[asset.symbol] = { value, amount: asset.amount };
    });

    if (i > 0) {
      const previousValue = performanceData[i - 1].totalValue;
      dailyData.dailyReturn = (dailyData.totalValue - previousValue) / previousValue;
    }

    performanceData.push(dailyData);
  }

  return performanceData;
};

export const getDemoPortfolio = async () => {
  try {
    console.log('Fetching demo portfolio...');
    const portfolio = await Portfolio.findOne({ userId: DEMO_USER_ID });
    if (portfolio) {
      console.log('Demo portfolio found');
    } else {
      console.log('Demo portfolio not found');
    }
    return portfolio;
  } catch (error) {
    console.error('Error fetching demo portfolio:', error);
    throw error;
  }
};

export const getDemoPerformanceData = async () => {
  try {
    console.log('Fetching demo performance data...');
    const performanceData = await PerformanceAnalytics.findOne({ userId: DEMO_USER_ID });
    if (performanceData) {
      console.log('Demo performance data found');
    } else {
      console.log('Demo performance data not found');
    }
    return performanceData;
  } catch (error) {
    console.error('Error fetching demo performance data:', error);
    throw error;
  }
};

export const getOrCreateDemoUser = async () => {
  try {
    console.log('Getting or creating demo user...');
    let portfolio = await getDemoPortfolio();
    let performanceAnalytics = await getDemoPerformanceData();

    if (!portfolio || !performanceAnalytics) {
      console.log('Demo user not found, creating new demo user...');
      ({ portfolio, performanceAnalytics } = await createDemoUser());
    }

    console.log('Demo user data retrieved successfully');
    return { portfolio, performanceAnalytics };
  } catch (error) {
    console.error('Error in getOrCreateDemoUser:', error);
    throw error;
  }
};