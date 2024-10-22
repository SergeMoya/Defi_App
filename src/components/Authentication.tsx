import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface AuthenticationProps {
  onAuthSuccess: (token: string, accountType?: 'personal' | 'demo') => void;
  onError: (message: string) => void;
}

const Authentication: React.FC<AuthenticationProps> = ({ onAuthSuccess, onError }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await axios.post(`http://localhost:5000${endpoint}`, { address, password });
      const { token } = response.data;
      if (token) {
        onAuthSuccess(token, 'personal');
      } else {
        onError('Authentication failed. Please check your credentials and try again.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      onError('Authentication failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login-demo');
      const { token } = response.data;
      if (token) {
        onAuthSuccess(token, 'demo');
      } else {
        onError('Demo login failed. Please try again.');
      }
    } catch (err) {
      console.error('Demo login error:', err);
      onError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
        {isLogin ? 'Login' : 'Register'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your wallet address"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      <div className="mt-4">
        <button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          {isLoading ? 'Loading...' : 'Login with Demo Account'}
        </button>
      </div>
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </motion.div>
  );
};

export default Authentication;