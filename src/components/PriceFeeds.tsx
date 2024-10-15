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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get the token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }
        //const response = await fetch('http://192.168.0.103:5000/api/price-feed?count=5', {
        const response = await fetch('http://192.168.1.123:5000/api/price-feed?count=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please log in again.');
          } else {
            throw new Error('Failed to fetch price data');
          }
        }

        const data: PriceData[] = await response.json();
        setPrices(data);
      } catch (err) {
        console.error('Error fetching price data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load price data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 300000); // Fetch every 30 seconds
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

  if (isLoading) {
    return <div className="text-center py-4">Loading price data...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }

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