import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import ErrorData from '../assets/error_real_time_api.svg';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PRICE_FEED_ENDPOINT = process.env.REACT_APP_PRICE_FEED_ENDPOINT;
const REFRESH_INTERVAL = parseInt(process.env.REACT_APP_DATA_REFRESH_INTERVAL || '300000');

interface PriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  image?: string;
  priceHistory: Array<{timestamp: number; price: number}>;
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

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        // Construct the full URL using environment variables
        const apiUrl = `${API_BASE_URL}${PRICE_FEED_ENDPOINT}`;
        console.log('Fetching from:', apiUrl); // Debug log

        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include' // Include credentials if your API requires it
        });

        console.log('Response status:', response.status);
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch price data: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Response data:', responseData); // Debug log

        // Handle the nested data structure from your API
        const priceData = responseData.data || responseData;
        
        if (!Array.isArray(priceData)) {
          throw new Error('Invalid data format received');
        }

        setPrices(priceData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching prices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch price data');
        setIsLoading(false);
      }
    };

    fetchPrices();
    // Use the environment variable for refresh interval
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const formatLargeNumber = (num: number): string => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const renderPriceChart = (coin: PriceData) => {
    if (!coin.priceHistory?.length) {
      return (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          No historical data available
        </div>
      );
    }

    const chartData = coin.priceHistory.map((point) => ({
      time: new Date(point.timestamp).getHours(),
      price: point.price
    }));

    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <XAxis 
            dataKey="time"
            tickFormatter={(value) => `${value}:00`}
          />
          <YAxis 
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
            labelFormatter={(value) => `${value}:00`}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8884d8" 
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading price data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg h-full min-h-[300px]"
      >
        <div className="p-8 h-full flex flex-col justify-center items-center">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
                Error Loading Price Data
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retry
              </button>
            </div>
            <div className="flex justify-center items-center">
              <img
                src={ErrorData}
                alt="Error Loading Data"
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 min-h-[300px]">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
        <span>Top Cryptocurrencies</span>
        {/*<span className="ml-2 text-sm text-gray-500">(Updates every 5 minutes)</span> */}
      </h2>
      <div className="space-y-6">
        {prices.map((coin) => (
          <motion.div 
            key={coin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="border-b border-gray-200 dark:border-gray-700 pb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {coin.image && (
                  <img src={coin.image} alt={coin.name} className="w-8 h-8 mr-3" />
                )}
                <div>
                  <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {coin.name}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {coin.symbol.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ${coin.current_price.toLocaleString()}
                </div>
                <div className={`flex items-center justify-end ${
                  coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <ArrowUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 mr-1" />
                  )}
                  <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>Volume 24h: {formatLargeNumber(coin.total_volume)}</span>
              <span>Market Cap: {formatLargeNumber(coin.market_cap)}</span>
            </div>

            <button
              className="mt-2 flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              onClick={() => setSelectedCoin(selectedCoin === coin.id ? null : coin.id)}
            >
              <ChartBarIcon className="h-4 w-4 mr-1" />
              {selectedCoin === coin.id ? 'Hide Chart' : 'Show Chart'}
            </button>
            
            {selectedCoin === coin.id && renderPriceChart(coin)}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PriceFeeds;