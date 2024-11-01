import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface WalletLoadingProps {
  message?: string;
}

const WalletLoading: React.FC<WalletLoadingProps> = ({ 
  message = 'Checking wallet connection...' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </motion.div>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            {message}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WalletLoading;