import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DataPoint {
  date: string;
  value: number;
}

const PerformanceAnalytics: React.FC = () => {
  // Mock data for the chart
  const data: DataPoint[] = [
    { date: '2024-01-01', value: 10000 },
    { date: '2024-02-01', value: 11200 },
    { date: '2024-03-01', value: 10800 },
    { date: '2024-04-01', value: 12500 },
    { date: '2024-05-01', value: 13100 },
    { date: '2024-06-01', value: 12800 },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Performance Analytics</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceAnalytics;