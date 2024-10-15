// src/components/Header.tsx

import React, { useState, useEffect } from 'react';
import { MoonIcon, SunIcon, BellIcon, UserCircleIcon, Bars3Icon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import { ethers } from 'ethers';
import logoImage from '../assets/acare_logo.png';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setWalletAddress(accounts[0].address);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setIsConnecting(true);
        setError(null);

        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);

        // Get the signer and retrieve the address
        const signer = await provider.getSigner();
        const address = await signer.getAddress(); // This retrieves the address as a string

        // Set the walletAddress state to the string value
        setWalletAddress(address);
      } catch (err) {
        console.error('Error connecting wallet:', err);
        setError('Failed to connect wallet. Please try again.');
      } finally {
        setIsConnecting(false);
      }
    } else {
      setError('MetaMask is not installed. Please install it to connect your wallet.');
      window.open('https://metamask.io/download.html', '_blank'); // Redirect user to MetaMask installation page
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <a href="#" className="flex items-center">
              <img className="h-8 w-auto mr-2" src={logoImage} alt="Acare Dashboard" />
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                Acare Dashboard
              </span>
            </a>
          </div>
          <nav className="hidden md:flex space-x-8">
            {['Dashboard', 'Analytics', 'Settings'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-4">
            {walletAddress ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatAddress(walletAddress)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="text-sm font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  isConnecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            <button
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </button>
            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            )}
            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="User profile"
            >
              <UserCircleIcon className="h-6 w-6" />
            </button>
            <button
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              onClick={toggleMobileMenu}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <Transition
        show={mobileMenuOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {['Dashboard', 'Analytics', 'Settings'].map((item) => (
              <a
                key={item}
                href="#"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </Transition>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </header>
  );
};

export default Header;