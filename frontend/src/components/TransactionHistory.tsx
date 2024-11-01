import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ArrowUpIcon, ArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../utils/formatters';
import { useWallet } from '../context/WalletContext';
import WalletPlaceholder from './common/WalletPlaceholder';
import { motion } from 'framer-motion';
import CreditCardIllustration from '../assets/credit_card.svg';

interface Transaction {
  _id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  price: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  totalValue: number;
}

interface TransactionResponse {
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
}

const TransactionHistory: React.FC = () => {
  const { isWalletConnected, isUsingDemoWallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(window.innerWidth <= 768 ? 5 : 10);
  const [sortColumn, setSortColumn] = useState<keyof Transaction>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setItemsPerPage(mobile ? 5 : 10);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get<TransactionResponse>(
        `${process.env.REACT_APP_API_BASE_URL}${process.env.REACT_APP_TRANSACTIONS_ENDPOINT}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            page: currentPage,
            limit: itemsPerPage,
            sort: `${sortDirection === 'asc' ? '' : '-'}${sortColumn}`,
            filter: filter === 'all' ? undefined : filter,
          },
        }
      );

      setTransactions(response.data.transactions);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalTransactions(response.data.totalTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortColumn, sortDirection, filter]);

  useEffect(() => {
    if (isWalletConnected || isUsingDemoWallet) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setIsLoading(false);
    }
  }, [fetchTransactions, isWalletConnected, isUsingDemoWallet]);

  const handleSort = (column: keyof Transaction) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  if (!isWalletConnected && !isUsingDemoWallet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 shadow-lg rounded-lg"
      >
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col justify-center items-center text-center max-w-lg mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">
                Transaction History
              </h2>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-6 md:mb-8 leading-relaxed">
                View and track all your cryptocurrency transactions in one place
              </p>
              <WalletPlaceholder 
                title="Connect Wallet to View Transactions"
                message="Please connect your wallet or use demo wallet to view your transaction history and track your trading activity."
              />
            </div>
            <div className="hidden lg:flex justify-center items-center">
              <img
                src={CreditCardIllustration}
                alt="Transaction History"
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const renderPagination = () => {
    return (
      <nav className="flex flex-col md:flex-row items-center justify-between mt-4 space-y-4 md:space-y-0">
        <div className="flex items-center text-center md:text-left w-full md:w-auto">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Showing page {currentPage} of {totalPages} ({totalTransactions} total)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-5 w-5" />
            <span className="hidden md:inline">Previous</span>
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </nav>
    );
  };


  const renderMobileTransaction = (transaction: Transaction) => {
    return (
      <div key={transaction._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className={`flex items-center ${transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'} font-medium`}>
            {transaction.type === 'buy' ? (
              <ArrowUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1" />
            )}
            {transaction.type === 'buy' ? 'Buy' : 'Sell'}
          </span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${
              transaction.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : transaction.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {transaction.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-500 dark:text-gray-400">Asset</div>
          <div className="text-right font-medium">{transaction.asset}</div>
          
          <div className="text-gray-500 dark:text-gray-400">Amount</div>
          <div className="text-right font-medium">{transaction.amount}</div>
          
          <div className="text-gray-500 dark:text-gray-400">Price</div>
          <div className="text-right font-medium">{formatCurrency(transaction.price)}</div>
          
          <div className="text-gray-500 dark:text-gray-400">Total Value</div>
          <div className="text-right font-medium">{formatCurrency(transaction.totalValue)}</div>
          
          <div className="text-gray-500 dark:text-gray-400">Date</div>
          <div className="text-right font-medium">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-white">
          Transaction History
        </h2>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'buy' | 'sell')}
            className="w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Transactions</option>
            <option value="buy">Buy Orders</option>
            <option value="sell">Sell Orders</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="w-full md:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">No transactions found.</div>
      ) : (
        <>
          {isMobile ? (
            <div className="space-y-4">
              {transactions.map(renderMobileTransaction)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    {['Type', 'Asset', 'Amount', 'Price', 'Total Value', 'Date', 'Status'].map((header) => (
                      <th
                        key={header}
                        onClick={() => handleSort(header.toLowerCase() as keyof Transaction)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <div className="flex items-center">
                          {header}
                          {sortColumn === header.toLowerCase() && (
                            <span className="ml-2">
                              {sortDirection === 'asc' ? (
                                <ArrowUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowDownIcon className="h-4 w-4" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-center ${transaction.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'buy' ? (
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 mr-1" />
                          )}
                          {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.asset}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(transaction.price)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(transaction.totalValue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{format(parseISO(transaction.date), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {renderPagination()}
        </>
      )}
    </motion.div>
  );
};

export default TransactionHistory;