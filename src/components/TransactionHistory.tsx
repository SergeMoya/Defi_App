import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  date: string;
}

const TransactionHistory: React.FC = () => {
  // Mock data for transactions
  const transactions: Transaction[] = [
    { id: '1', type: 'buy', asset: 'BTC', amount: 0.5, price: 50000, date: '2024-03-15' },
    { id: '2', type: 'sell', asset: 'ETH', amount: 2, price: 3000, date: '2024-03-14' },
    { id: '3', type: 'buy', asset: 'USDT', amount: 1000, price: 1, date: '2024-03-13' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Transaction History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Asset</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.type === 'buy' ? (
                    <span className="text-green-600 flex items-center">
                      <ArrowUpIcon className="h-4 w-4 mr-1" />
                      Buy
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center">
                      <ArrowDownIcon className="h-4 w-4 mr-1" />
                      Sell
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.asset}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.amount}</td>
                <td className="px-6 py-4 whitespace-nowrap">${transaction.price.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;