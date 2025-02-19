import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import WalletPlaceholder from './common/WalletPlaceholder';
import { cryptoPriceService } from '../services/CryptoPriceService';
import { Wallet, TrendingUp, Activity } from 'lucide-react';
import CryptoPortfolio from '../assets/crypto_portfolio.svg';

// Environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PORTFOLIO_ENDPOINT = process.env.REACT_APP_PORTFOLIO_ENDPOINT;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

interface AssetData {
  name: string;
  symbol: string;
  value: number;
  amount: number;
  change24h: number;
  change7d: number;
  change30d: number;
  changeAllTime: number;
  purchasePrice?: number;
}

interface PortfolioData {
  assets: AssetData[];
  totalValue: number;
  totalChange24h: number;
  totalChange7d: number;
  totalChange30d: number;
  totalChangeAllTime: number;
  initialInvestment?: number;
}

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
}

interface QuickActionButtonProps {
  icon: React.ElementType;
  label: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-lg w-full"
  >
    <div className="flex items-center space-x-3">
      <div className="rounded-full p-2.5 bg-indigo-100 dark:bg-indigo-900 flex-shrink-0">
        <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <div className="flex items-baseline">
          <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">{value}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ icon: Icon, label }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="flex items-center justify-center px-3 py-2 md:px-4 md:py-2 border border-transparent text-xs md:text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
  >
    <Icon className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
    {label}
  </motion.button>
);

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-2 md:gap-4 text-xs md:text-sm mt-4">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center">
          <div className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1 md:mr-2" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-700 dark:text-gray-300">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
};

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

      const response = await axios.get<PortfolioData>(`${API_BASE_URL}${PORTFOLIO_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Calculate percentages for different time periods
      const portfolioData = response.data;
      const calculatePercentageChange = (currentValue: number, previousValue: number) => {
        return previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      };

      // If the API doesn't provide these values, you can calculate them here
      portfolioData.totalChange7d = portfolioData.totalChange7d || 0;
      portfolioData.totalChange30d = portfolioData.totalChange30d || 0;
      portfolioData.totalChangeAllTime = portfolioData.totalValue - (portfolioData.initialInvestment || 0);

      setPortfolioData(portfolioData);
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
      const subscription = cryptoPriceService.getPricesObservable().subscribe({
        next: () => {
          fetchPortfolioData();
        },
        error: (err: Error | unknown) => {
          console.error('Error in price subscription:', err);
          setError(err instanceof Error ? err.message : 'Error updating portfolio data');
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setPortfolioData(null);
      setLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet]);

  const getChangeDisplay = (change: number, total: number) => {
    const percentage = (change / (total - change)) * 100;
    return {
      value: formatCurrency(change),
      percentage: formatPercentage(percentage)
    };
  };

  if (!isWalletConnected && !isUsingDemoWallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl"
      >
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col justify-center items-center text-center max-w-lg mx-auto">
              <h3 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
                Portfolio Overview
              </h3>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 md:mb-8 leading-relaxed">
                Connect your wallet to view and manage your crypto portfolio
              </p>
              <WalletPlaceholder
                title="Connect Wallet to View Portfolio"
                message="Please connect your wallet or use demo wallet to view your portfolio details and track your assets."
              />
            </div>
            <div className="hidden lg:flex justify-center items-center">
              <img
                src={CryptoPortfolio}
                alt="Crypto Portfolio"
                className="w-full max-w-xs md:max-w-md"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl p-6 md:p-8">
        <div className="flex flex-col items-center justify-center h-48 md:h-64">
          <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-sm md:text-base text-gray-600 dark:text-gray-400">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl p-6 md:p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 md:h-8 md:w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white mb-2">Error Loading Portfolio</h3>
          <p className="text-sm md:text-base text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl p-6 md:p-8">
        <div className="text-center">
          <img
            src={CryptoPortfolio}
            alt="No Portfolio Data"
            className="w-32 h-32 md:w-48 md:h-48 mx-auto mb-4 opacity-50"
          />
          <h3 className="text-lg md:text-xl font-medium text-gray-900 dark:text-white">No Portfolio Data</h3>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Start by adding some assets to your portfolio</p>
        </div>
      </div>
    );
  }

  const { assets, totalValue, totalChange24h } = portfolioData;
  const totalChangePercentage = (totalChange24h / (totalValue - totalChange24h)) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 overflow-hidden shadow-lg rounded-xl"
    >
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h3>
              <div className="flex items-baseline">
                <span className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalValue)}
                </span>
                <span className={`ml-1 md:ml-2 flex items-baseline text-xs md:text-sm font-semibold ${
                  totalChangePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalChangePercentage >= 0 ? (
                    <ArrowUpIcon className="self-center flex-shrink-0 h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <ArrowDownIcon className="self-center flex-shrink-0 h-4 w-4 md:h-5 md:w-5" />
                  )}
                  {formatPercentage(Math.abs(totalChangePercentage))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 md:mb-6 max-w-full">
              <div className="w-full">
                <FeatureCard
                  icon={Wallet}
                  title="Total Balance"
                  value={formatCurrency(totalValue)}
                />
              </div>
              <div className="w-full">
                <FeatureCard
                  icon={TrendingUp}
                  title="24h Change"
                  value={formatCurrency(totalChange24h)}
                />
              </div>
              <div className="w-full">
                <FeatureCard
                  icon={Activity}
                  title="Active Assets"
                  value={assets.length.toString()}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 p-4 md:p-6 rounded-xl mb-4 md:mb-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assets}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    {assets.map((_, index) => (
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
                          <div className="bg-white dark:bg-gray-700 p-2 md:p-3 rounded-lg shadow-lg">
                            <p className="text-xs md:text-sm font-semibold mb-1">{data.name}</p>
                            <p className="text-xs md:text-sm">{formatCurrency(data.value)}</p>
                            <p className="text-xs md:text-sm">{data.amount} {data.symbol}</p>
                            <p className={`text-xs md:text-sm ${data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="bg-white dark:bg-gray-700 p-4 md:p-6 rounded-xl shadow-lg">
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-200">
                Asset Breakdown
              </h4>
              <div className="space-y-2 md:space-y-3">
                {assets.map((asset, index) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors duration-150"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        <span className="text-white text-xs md:text-sm font-bold">
                          {asset.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="ml-2 md:ml-3">
                        <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white">
                          {asset.name}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                          {asset.amount} {asset.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-white">
                        {formatCurrency(asset.value)}
                      </p>
                      <p className={`text-xs md:text-sm ${
                        asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(asset.change24h)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-4 md:p-6 rounded-xl shadow-lg">
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800 dark:text-gray-200">
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <QuickActionButton icon={CurrencyDollarIcon} label="Buy / Sell" />
                <QuickActionButton icon={ArrowPathIcon} label="Swap Assets" />
                <QuickActionButton icon={PlusIcon} label="Add Assets" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: '24h Change',
              ...getChangeDisplay(portfolioData.totalChange24h, portfolioData.totalValue)
            },
            {
              label: '7d Change',
              ...getChangeDisplay(portfolioData.totalChange7d || 0, portfolioData.totalValue)
            },
            {
              label: '30d Change',
              ...getChangeDisplay(portfolioData.totalChange30d || 0, portfolioData.totalValue)
            },
            {
              label: 'All Time',
              ...getChangeDisplay(portfolioData.totalChangeAllTime || 0, portfolioData.totalValue)
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-4 rounded-xl shadow-md"
            >
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
              <p className={`text-sm ${
                parseFloat(item.percentage) > 0 ? 'text-green-600' :
                parseFloat(item.percentage) < 0 ? 'text-red-600' : 'text-gray-500'
              }`}>
                {item.percentage}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioOverview;