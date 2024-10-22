import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import WalletPlaceholder from './common/WalletPlaceholder';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface AssetData {
  name: string;
  symbol: string;
  value: number;
  amount: number;
  change24h: number;
}

interface PortfolioData {
  assets: AssetData[];
  totalValue: number;
  totalChange24h: number;
}

const PortfolioOverview: React.FC = () => {
  const { isWalletConnected, isUsingDemoWallet } = useWallet();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get<PortfolioData>('http://localhost:5000/api/portfolio', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPortfolioData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
      setError('Failed to fetch portfolio data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletConnected || isUsingDemoWallet) {
      fetchPortfolioData();
      const intervalId = setInterval(fetchPortfolioData, 5 * 60 * 1000); // Refresh every 5 minutes
      return () => clearInterval(intervalId);
    } else {
      setPortfolioData(null);
      setLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet]);

  // Show placeholder when no wallet is connected
  if (!isWalletConnected && !isUsingDemoWallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg"
      >
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Overview</h3>
          <WalletPlaceholder 
            title="Connect Wallet to View Portfolio"
            message="Please connect your wallet or use demo wallet to view your portfolio details and track your assets."
          />
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Overview</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Overview</h3>
        <div className="text-red-500 text-center p-4">{error}</div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Overview</h3>
        <div className="text-center p-4">No portfolio data available.</div>
      </div>
    );
  }

  const { assets, totalValue, totalChange24h } = portfolioData;
  const totalChangePercentage = (totalChange24h / (totalValue - totalChange24h)) * 100;

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handlePieLeave = () => {
    setActiveIndex(-1);
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <ul className="flex flex-wrap justify-center gap-4 text-sm mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700 dark:text-gray-300">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const QuickActionButton: React.FC<{ icon: React.ElementType; label: string }> = ({ icon: Icon, label }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
    >
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </motion.button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-lg"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</span>
            <span className={`ml-2 flex items-baseline text-sm font-semibold ${totalChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChangePercentage >= 0 ? (
                <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5" aria-hidden="true" />
              ) : (
                <ArrowDownIcon className="self-center flex-shrink-0 h-5 w-5" aria-hidden="true" />
              )}
              <span className="sr-only">{totalChangePercentage >= 0 ? 'Increased' : 'Decreased'} by</span>
              {formatPercentage(Math.abs(totalChangePercentage))}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex justify-center items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={assets}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  onMouseEnter={handlePieEnter}
                  onMouseLeave={handlePieLeave}
                >
                  {assets.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      opacity={activeIndex === index ? 0.8 : 1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as AssetData;
                      return (
                        <div className="bg-white dark:bg-gray-700 p-2 shadow rounded">
                          <p className="text-sm font-semibold">{data.name}</p>
                          <p className="text-sm">{formatCurrency(data.value)}</p>
                          <p className="text-sm">{data.amount} {data.symbol}</p>
                          <p className={`text-sm ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(data.change24h)} (24h)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend content={renderLegend} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Asset Breakdown</h4>
            <ul className="space-y-3">
              {assets.map((asset, index) => (
                <motion.li
                  key={asset.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(asset.value)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{asset.amount} {asset.symbol}</p>
                    <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(asset.change24h)} (24h)
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Performance Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '24h Change', value: formatCurrency(totalChange24h), percentage: formatPercentage(totalChangePercentage) },
              { label: '7d Change', value: 'N/A', percentage: 'N/A' },
              { label: '30d Change', value: 'N/A', percentage: 'N/A' },
              { label: 'All Time', value: 'N/A', percentage: 'N/A' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
                <p className={`text-sm ${item.percentage.startsWith('+') ? 'text-green-600' : item.percentage.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
                  {item.percentage}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Actions</h4>
          <div className="flex flex-wrap gap-4">
            <QuickActionButton icon={CurrencyDollarIcon} label="Buy / Sell" />
            <QuickActionButton icon={ArrowPathIcon} label="Swap Assets" />
            <QuickActionButton icon={PlusIcon} label="Add Assets" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioOverview;