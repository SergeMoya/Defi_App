import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, Brush, ReferenceLine } from 'recharts';
import { format, subMonths, parseISO, isAfter } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useWallet } from '../context/WalletContext';
import WalletPlaceholder from './common/WalletPlaceholder';
import axios from 'axios';

interface PerformanceData {
  date: string;
  totalValue: number;
  dailyReturn: number;
}

interface NormalizedPerformanceData extends PerformanceData {
  normalizedValue: number;
}

interface BrushStartEndIndex {
  startIndex?: number;
  endIndex?: number;
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
}

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const PERFORMANCE_ENDPOINT = process.env.REACT_APP_PERFORMANCE_ENDPOINT;
const PERFORMANCE_UPDATE_ENDPOINT = process.env.REACT_APP_PERFORMANCE_UPDATE_ENDPOINT;
const DATA_REFRESH_INTERVAL = Number(process.env.REACT_APP_DATA_REFRESH_INTERVAL) || 300000; // Default to 5 minutes

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend }) => (
  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{title}</h3>
    <div className="flex items-baseline justify-between">
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}%</p>
      <span
        className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        } flex items-center`}
      >
        {trend === 'up' ? (
          <ArrowUpIcon className="h-5 w-5 mr-1" />
        ) : (
          <ArrowDownIcon className="h-5 w-5 mr-1" />
        )}
        {trend === 'up' ? 'Up' : 'Down'}
      </span>
    </div>
  </div>
);

const PerformanceAnalytics: React.FC = () => {
  const { isWalletConnected, isUsingDemoWallet } = useWallet();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [dateRange, setDateRange] = useState('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const [showNormalizedData, setShowNormalizedData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformanceData = useCallback(async () => {
    if (!isWalletConnected && !isUsingDemoWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<PerformanceData[]>(`${API_BASE_URL}${PERFORMANCE_ENDPOINT}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to fetch performance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet]);

  const handleUpdateData = async () => {
    if (!isWalletConnected && !isUsingDemoWallet) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.post(`${API_BASE_URL}${PERFORMANCE_UPDATE_ENDPOINT}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchPerformanceData();
    } catch (error) {
      console.error('Error updating performance data:', error);
      setError('Failed to update performance data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletConnected || isUsingDemoWallet) {
      fetchPerformanceData();
      const intervalId = setInterval(fetchPerformanceData, DATA_REFRESH_INTERVAL);
      return () => clearInterval(intervalId);
    } else {
      setPerformanceData([]);
      setIsLoading(false);
    }
  }, [isWalletConnected, isUsingDemoWallet, fetchPerformanceData]);

  const filteredData = useMemo(() => {
    const months = dateRange === '1Y' ? 12 : dateRange === '6M' ? 6 : dateRange === '3M' ? 3 : 36;
    const startDate = subMonths(new Date(), months);
    return performanceData.filter((d) => isAfter(parseISO(d.date), startDate));
  }, [performanceData, dateRange]);

  const normalizedData: NormalizedPerformanceData[] = useMemo(() => {
    if (filteredData.length === 0) return [];
    const startValue = filteredData[0].totalValue;
    return filteredData.map((item) => ({
      ...item,
      normalizedValue: (item.totalValue / startValue) * 100,
    }));
  }, [filteredData]);

  const calculatePerformanceMetrics = useCallback((data: PerformanceData[]) => {
    if (data.length < 2) return { portfolioReturn: 0, benchmarkReturn: 0, alpha: 0, sharpeRatio: 0 };

    const startValue = data[0].totalValue;
    const endValue = data[data.length - 1].totalValue;
    const portfolioReturn = ((endValue - startValue) / startValue) * 100;

    const benchmarkReturn = 0;
    const alpha = portfolioReturn - benchmarkReturn;

    const returns = data.slice(1).map((d, i) => (d.totalValue - data[i].totalValue) / data[i].totalValue);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252);

    return { portfolioReturn, benchmarkReturn, alpha, sharpeRatio };
  }, []);

  const { portfolioReturn, benchmarkReturn, alpha, sharpeRatio } = useMemo(
    () => calculatePerformanceMetrics(filteredData),
    [filteredData, calculatePerformanceMetrics]
  );

  const handleBrushChange = useCallback((newRange: BrushStartEndIndex) => {
    if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined && newRange.startIndex !== newRange.endIndex) {
      const startDate = filteredData[newRange.startIndex].date;
      const endDate = filteredData[newRange.endIndex].date;
      console.log(`Custom range selected: ${startDate} to ${endDate}`);
    }
  }, [filteredData]);

  if (!isWalletConnected && !isUsingDemoWallet) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Performance Analytics</h2>
          <WalletPlaceholder 
            title="Connect Wallet to View Performance"
            message="Please connect your wallet or use demo wallet to view your portfolio performance analytics and track your returns."
          />
        </div>
      </div>
    );
  }

  if (isLoading && !performanceData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Performance Analytics</h2>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const chartData = showNormalizedData ? normalizedData : filteredData;

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Performance Analytics</h2>
        <button
          onClick={handleUpdateData}
          disabled={isLoading}
          className={`px-4 py-2 rounded-full transition-all duration-300 ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Updating...' : 'Add Latest Data Point'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-2">
          {['3M', '6M', '1Y', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                dateRange === range
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Portfolio Return"
          value={portfolioReturn.toFixed(2)}
          trend={portfolioReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Benchmark Return"
          value={benchmarkReturn.toFixed(2)}
          trend={benchmarkReturn >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Alpha"
          value={alpha.toFixed(2)}
          trend={alpha >= 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          trend={sharpeRatio >= 1 ? 'up' : 'down'}
        />
      </div>

      <div className="flex justify-end space-x-6 mb-6">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
            checked={showBenchmark}
            onChange={(e) => setShowBenchmark(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show Benchmark</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
            checked={showArea}
            onChange={(e) => setShowArea(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show Area</span>
        </label>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600 rounded transition duration-150 ease-in-out"
            checked={showNormalizedData}
            onChange={(e) => setShowNormalizedData(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show Normalized Data</span>
        </label>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl shadow-inner">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: 12 }}
            />
            <YAxis
              domain={showNormalizedData ? [0, 'dataMax + 10'] : [0, 'dataMax + 1000']}
              stroke="#718096"
              tick={{ fill: '#718096', fontSize: 12 }}
              tickFormatter={(value) => showNormalizedData ? `${value.toFixed(0)}%` : `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#4a5568', fontWeight: 'bold' }}
              labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
              formatter={(value: number, name: string) => [
                showNormalizedData ? `${value.toFixed(2)}%` : `$${value.toLocaleString()}`,
                name === 'totalValue' || name === 'normalizedValue' ? 'Portfolio Value' : 'Daily Return'
              ]}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={10}
            />
            <Line
              type="monotone"
              dataKey={showNormalizedData ? "normalizedValue" : "totalValue"}
              name="Portfolio Value"
              stroke="#8884d8"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8 }}
            />
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey="dailyReturn"
                name="Daily Return"
                stroke="#82ca9d"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8 }}
              />
            )}
            {showArea && (
              <>
                <Area
                  type="monotone"
                  dataKey={showNormalizedData ? "normalizedValue" : "totalValue"}
                  fill="url(#colorPortfolio)"
                  fillOpacity={0.3}
                />
                {showBenchmark && (
                  <Area
                    type="monotone"
                    dataKey="dailyReturn"
                    fill="url(#colorBenchmark)"
                    fillOpacity={0.3}
                  />
                )}
              </>
            )}
            {chartData.length > 0 && (
              <ReferenceLine
                y={showNormalizedData ? 100 : chartData[0].totalValue}
                label={{ value: "Start", position: 'insideLeft', fill: '#e53e3e', fontSize: 12 }}
                stroke="#e53e3e"
                strokeDasharray="3 3"
              />
            )}
            <Brush
              dataKey="date"
              height={30}
              stroke="#8884d8"
              fill="#f7fafc"
              travellerWidth={10}
              onChange={handleBrushChange}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;