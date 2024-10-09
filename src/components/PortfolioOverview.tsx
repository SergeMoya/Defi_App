import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'ETH', value: 400 },
  { name: 'BTC', value: 300 },
  { name: 'USDT', value: 200 },
  { name: 'Other', value: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const PortfolioOverview: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Portfolio Overview</h3>
          </div>
          <div className="ml-auto flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900 dark:text-white">$12,345.67</span>
            <span className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
              <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
              <span className="sr-only">Increased by</span>
              8.1%
            </span>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800 px-5 py-3">
        <div className="text-sm">
          <ResponsiveContainer width="100%" height={200}>
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
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PortfolioOverview;