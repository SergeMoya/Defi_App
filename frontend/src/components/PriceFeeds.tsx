import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cryptoPriceService, CryptoPrice } from '../services/CryptoPriceService';
import { motion } from 'framer-motion';
import ErrorData from '../assets/error_real_time_api.svg';

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
    // Subscribe to price updates
    const subscription = cryptoPriceService.getPricesObservable().subscribe({
      next: (cryptoPrices: CryptoPrice[]) => {
        const transformedPrices: PriceData[] = cryptoPrices.map(cp => ({
          symbol: cp.symbol.toUpperCase(),
          price: cp.current_price,
          change24h: cp.price_change_percentage_24h,
          volume24h: cp.total_volume,
          marketCap: cp.market_cap,
          priceHistory: [],
        }));
        setPrices(transformedPrices);
        setIsLoading(false);
      },
      error: (err: Error | unknown) => {
        console.error('Error in price subscription:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch price data. Please try again.');
        setIsLoading(false);
      }
    });

    // Trigger initial price fetch
    cryptoPriceService.refreshPrices().catch((err: Error | unknown) => {
      console.error('Error refreshing prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch initial price data.');
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Price Feeds</h2>
      <div className="space-y-4">
        {prices.map((price) => (
          <div key={price.symbol} className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <div className="flex items-center justify-between mb-4">
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
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
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
