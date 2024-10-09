import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  priceHistory: { timestamp: number; price: number }[];
}

const PriceFeeds: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      // In a real application, you would fetch this data from an API
      // For now, we'll use more detailed mock data
      const mockData: PriceData[] = [
        {
          symbol: 'BTC',
          price: 50000,
          change24h: 2.5,
          volume24h: 30000000000,
          marketCap: 950000000000,
          priceHistory: Array.from({ length: 24 }, (_, i) => ({
            timestamp: Date.now() - (23 - i) * 3600000,
            price: 50000 + Math.random() * 2000 - 1000,
          })),
        },
        {
          symbol: 'ETH',
          price: 3000,
          change24h: -1.2,
          volume24h: 15000000000,
          marketCap: 350000000000,
          priceHistory: Array.from({ length: 24 }, (_, i) => ({
            timestamp: Date.now() - (23 - i) * 3600000,
            price: 3000 + Math.random() * 100 - 50,
          })),
        },
        {
          symbol: 'USDT',
          price: 1,
          change24h: 0.1,
          volume24h: 50000000000,
          marketCap: 80000000000,
          priceHistory: Array.from({ length: 24 }, (_, i) => ({
            timestamp: Date.now() - (23 - i) * 3600000,
            price: 1 + Math.random() * 0.002 - 0.001,
          })),
        },
        {
          symbol: 'XRP',
          price: 0.5,
          change24h: 1.8,
          volume24h: 2000000000,
          marketCap: 25000000000,
          priceHistory: Array.from({ length: 24 }, (_, i) => ({
            timestamp: Date.now() - (23 - i) * 3600000,
            price: 0.5 + Math.random() * 0.02 - 0.01,
          })),
        },
      ];
      setPrices(mockData);
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const renderPriceChart = (coin: PriceData) => {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={coin.priceHistory}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
          />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip
            labelFormatter={(label) => format(new Date(label), 'MMM dd, HH:mm')}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Price Feeds</h2>
      <div className="space-y-4">
        {prices.map((price) => (
          <div key={price.symbol} className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="flex items-center justify-between mb-2">
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
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Volume 24h: {formatLargeNumber(price.volume24h)}</span>
              <span>Market Cap: {formatLargeNumber(price.marketCap)}</span>
            </div>
            <button
              className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={() => setSelectedCoin(selectedCoin === price.symbol ? null : price.symbol)}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {selectedCoin === price.symbol ? 'Hide Chart' : 'Show Chart'}
            </button>
            {selectedCoin === price.symbol && renderPriceChart(price)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PriceFeeds;