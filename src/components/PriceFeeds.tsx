import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
}

const PriceFeeds: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);

  useEffect(() => {
    const fetchPrices = async () => {
      // In a real application, you would fetch this data from an API
      // For now, we'll use mock data
      const mockData: PriceData[] = [
        { symbol: 'BTC', price: 50000, change24h: 2.5 },
        { symbol: 'ETH', price: 3000, change24h: -1.2 },
        { symbol: 'USDT', price: 1, change24h: 0.1 },
      ];
      setPrices(mockData);
    };

    fetchPrices();
    // Set up an interval to fetch prices every 30 seconds
    const interval = setInterval(fetchPrices, 30000);

    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Price Feeds</h2>
      <div className="space-y-4">
        {prices.map((price) => (
          <div key={price.symbol} className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">{price.symbol}</span>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                ${price.price.toLocaleString()}
              </div>
              <div className={`flex items-center ${price.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {price.change24h >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                <span>{Math.abs(price.change24h).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceFeeds;