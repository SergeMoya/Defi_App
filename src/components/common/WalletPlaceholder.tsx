import React from 'react';
import { WalletIcon } from '@heroicons/react/24/outline';
import { useWallet } from '../../context/WalletContext';

interface WalletPlaceholderProps {
  title?: string;
  message?: string;
}

const WalletPlaceholder: React.FC<WalletPlaceholderProps> = ({
  title = 'Wallet Connection Required',
  message = 'Please connect your wallet or use demo wallet to view this section\'s data'
}) => {
  const { accountType } = useWallet();

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm min-h-[300px]">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
        <WalletIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {message}
      </p>
      {accountType === 'demo' && (
        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-4">
          Tip: You can use the demo wallet to explore features without connecting your own wallet
        </p>
      )}
    </div>
  );
};

export default WalletPlaceholder;