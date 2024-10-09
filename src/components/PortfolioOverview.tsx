import React, { useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, ArrowPathIcon, PlusIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const initialData = [
  { name: 'ETH', value: 5000, amount: 2.5, change24h: 5.2 },
  { name: 'BTC', value: 4000, amount: 0.1, change24h: -2.1 },
  { name: 'USDT', value: 2000, amount: 2000, change24h: 0.1 },
  { name: 'Other', value: 1345.67, amount: 0, change24h: 1.5 },
];

const PortfolioOverview: React.FC = () => {
  const [data, setData] = useState(initialData);
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const totalChange24h = data.reduce((sum, item) => sum + (item.value * item.change24h) / 100, 0);
  const totalChangePercentage = (totalChange24h / (totalValue - totalChange24h)) * 100;

  const handlePieClick = (entry: any, index: number) => {
    // Simulate a price change when clicking on a pie slice
    const newData = [...data];
    newData[index] = {
      ...newData[index],
      value: newData[index].value * (1 + (Math.random() - 0.5) * 0.1),
      change24h: newData[index].change24h + (Math.random() - 0.5) * 2,
    };
    setData(newData);
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
    <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <Icon className="mr-2 h-5 w-5" />
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
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
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  onClick={handlePieClick}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-700 p-2 shadow rounded">
                          <p className="text-sm font-semibold">{data.name}</p>
                          <p className="text-sm">{formatCurrency(data.value)}</p>
                          <p className="text-sm">{data.amount} {data.name}</p>
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
              {data.map((asset, index) => (
                <li key={asset.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(asset.value)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{asset.amount} {asset.name}</p>
                    <p className={`text-xs ${asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(asset.change24h)} (24h)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Performance Summary</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '24h Change', value: formatCurrency(totalChange24h), percentage: formatPercentage(totalChangePercentage) },
              { label: '7d Change', value: formatCurrency(totalValue * 0.15), percentage: '+15.00%' },
              { label: '30d Change', value: formatCurrency(totalValue * 0.25), percentage: '+25.00%' },
              { label: 'All Time', value: formatCurrency(totalValue * 2), percentage: '+200.00%' },
            ].map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
                <p className={`text-sm ${item.percentage.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {item.percentage}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Quick Actions</h4>
          <div className="flex flex-wrap gap-4">
            <QuickActionButton icon={CurrencyDollarIcon} label="Buy / Sell" />
            <QuickActionButton icon={ArrowPathIcon} label="Swap Assets" />
            <QuickActionButton icon={PlusIcon} label="Add Funds" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;