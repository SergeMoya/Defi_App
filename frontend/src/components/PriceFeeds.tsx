import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  priceHistory: { timestamp: number; price: number }[];
}

const API_BASE_URL = 'http://192.168.1.123:5000'; 
//const API_BASE_URL = 'http://192.168.0.103:5000'; 
const REFRESH_INTERVAL = 300000; // 5 minute

const PriceFeeds: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<PriceData[]>(`${API_BASE_URL}/api/price-feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { count: 5 }
      });

      setPrices(response.data);
    } catch (err) {
      console.error('Error fetching price data:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 429) {
          setError('Rate limit exceeded. Please try again later.');
        } else {
          setError('Failed to fetch price data. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const renderPriceChart = (coin: PriceData) => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={coin.priceHistory}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')}
        />
        <YAxis 
          domain={['auto', 'auto']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip
          labelFormatter={(label) => format(new Date(label), 'MMM dd, HH:mm')}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
        />
        <Line type="monotone" dataKey="price" stroke="#8884d8" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (isLoading && prices.length === 0) {
    return <div className="text-center py-4">Loading price data...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
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