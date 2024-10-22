import React, { useState } from 'react';
import { MoonIcon, SunIcon, BellIcon, UserCircleIcon, Bars3Icon, ArrowRightOnRectangleIcon, WalletIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import { Snackbar, Alert } from '@mui/material';
import logoImage from '../assets/acare_logo.png';
import { useWallet } from '../context/WalletContext';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  accountType: 'personal' | 'demo';
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, accountType }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const {
    isWalletConnected,
    isUsingDemoWallet,
    walletAddress,
    connectWallet,
    useDemoWallet,
    disconnectWallet
  } = useWallet();

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setSnackbarOpen(true);
    }
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

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img className="h-8 w-auto mr-2" src={logoImage} alt="Acare Dashboard" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Acare Dashboard
            </span>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            {['Dashboard', 'Analytics', 'Settings'].map((item) => (
              <button
                key={item}
                className="text-base font-medium text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated && (
              <>
                {(isWalletConnected || isUsingDemoWallet) ? (
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2">
                    <WalletIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formatAddress(walletAddress!)}
                    </span>
                    <button
                      onClick={disconnectWallet}
                      className="ml-2 px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-full transition duration-150 ease-in-out flex items-center"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleConnectWallet}
                      className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out flex items-center"
                    >
                      <WalletIcon className="h-5 w-5 mr-2" />
                      Connect Wallet
                    </button>
                    {accountType === 'demo' && (
                      <button
                        onClick={useDemoWallet}
                        className="px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                      >
                        Use Demo Wallet
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            <button
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
            </button>
            
            <button
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>

            {isAuthenticated && (
              <button
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            )}

            <button
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white transition duration-150 ease-in-out"
              onClick={toggleMobileMenu}
              aria-label="Open menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

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
              <button
                key={item}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 transition duration-150 ease-in-out"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </Transition>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </header>
  );
};

export default Header;