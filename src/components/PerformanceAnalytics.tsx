import React, { useState, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, Brush, ReferenceLine } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isAfter } from 'date-fns';
import { ArrowUpIcon, ArrowDownIcon, CogIcon } from '@heroicons/react/24/solid';

interface DataPoint {
  date: string;
  portfolio: number;
  benchmark: number;
}

const generateMockData = (months: number): DataPoint[] => {
  const data: DataPoint[] = [];
  const startDate = subMonths(new Date(), months);

  for (let i = 0; i <= months; i++) {
    const currentDate = format(subMonths(new Date(), months - i), 'yyyy-MM-dd');
    const portfolio = Math.floor(10000 + Math.random() * 5000);
    const benchmark = Math.floor(10000 + Math.random() * 5000);
    data.push({ date: currentDate, portfolio, benchmark });
  }

  return data;
};

const calculatePerformanceMetrics = (data: DataPoint[]) => {
  const startPortfolio = data[0].portfolio;
  const endPortfolio = data[data.length - 1].portfolio;
  const portfolioReturn = ((endPortfolio - startPortfolio) / startPortfolio) * 100;

  const startBenchmark = data[0].benchmark;
  const endBenchmark = data[data.length - 1].benchmark;
  const benchmarkReturn = ((endBenchmark - startBenchmark) / startBenchmark) * 100;

  const alpha = portfolioReturn - benchmarkReturn;

  // Calculate Sharpe Ratio (simplified)
  const portfolioReturns = data.slice(1).map((d, i) => (d.portfolio - data[i].portfolio) / data[i].portfolio);
  const avgReturn = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
  const stdDev = Math.sqrt(portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / portfolioReturns.length);
  const sharpeRatio = (avgReturn / stdDev) * Math.sqrt(252); // Annualized Sharpe Ratio

  return { portfolioReturn, benchmarkReturn, alpha, sharpeRatio };
};

interface BrushStartEndIndex {
    startIndex?: number;
    endIndex?: number;
}

const PerformanceAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showArea, setShowArea] = useState(true);
  const data = useMemo(() => generateMockData(36), []); // Generate 3 years of data

  const filteredData = useMemo(() => {
    const months = dateRange === '1Y' ? 12 : dateRange === '6M' ? 6 : dateRange === '3M' ? 3 : 36;
    const startDate = subMonths(new Date(), months);
    return data.filter((d) => isAfter(parseISO(d.date), startDate));
  }, [data, dateRange]);

  const { portfolioReturn, benchmarkReturn, alpha, sharpeRatio } = useMemo(
    () => calculatePerformanceMetrics(filteredData),
    [filteredData]
  );

  const handleBrushChange = useCallback((newRange: BrushStartEndIndex) => {
    if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined && newRange.startIndex !== newRange.endIndex) {
      const startDate = filteredData[newRange.startIndex].date;
      const endDate = filteredData[newRange.endIndex].date;
      console.log(`Custom range selected: ${startDate} to ${endDate}`);
      // Here you can update state or perform any other action based on the selected range
    }
  }, [filteredData]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Performance Analytics</h2>
        <div className="flex space-x-2">
          {['3M', '6M', '1Y', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded ${
                dateRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

      <div className="flex justify-end space-x-4 mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600"
            checked={showBenchmark}
            onChange={(e) => setShowBenchmark(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show Benchmark</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="form-checkbox h-5 w-5 text-indigo-600"
            checked={showArea}
            onChange={(e) => setShowArea(e.target.checked)}
          />
          <span className="ml-2 text-gray-700 dark:text-gray-300">Show Area</span>
        </label>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(date) => format(parseISO(date), 'MMM dd, yyyy')}
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString()}`,
              name.charAt(0).toUpperCase() + name.slice(1)
            ]}
          />
          <Legend />
          <Line type="monotone" dataKey="portfolio" name="Portfolio" stroke="#8884d8" strokeWidth={2} dot={false} />
          {showBenchmark && (
            <Line type="monotone" dataKey="benchmark" name="Benchmark" stroke="#82ca9d" strokeWidth={2} dot={false} />
          )}
          {showArea && (
            <Area type="monotone" dataKey="portfolio" fill="#8884d8" fillOpacity={0.1} />
          )}
          <ReferenceLine y={filteredData[0].portfolio} label="Start" stroke="red" strokeDasharray="3 3" />
          <Brush dataKey="date" height={30} stroke="#8884d8" onChange={handleBrushChange} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend }) => (
  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
    <div className="mt-1 flex items-baseline justify-between">
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}%</p>
      <span
        className={`text-sm font-medium ${
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        } flex items-center`}
      >
        {trend === 'up' ? (
          <ArrowUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 mr-1" />
        )}
        {trend === 'up' ? 'Up' : 'Down'}
      </span>
    </div>
  </div>
);

export default PerformanceAnalytics;