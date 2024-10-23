import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletAuthState {
  isConnected: boolean;
  address: string | null;
  isDemoAccount: boolean;
  isDemoWallet: boolean;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  useDemoWallet: () => Promise<void>;
}

const WalletAuthContext = createContext<WalletAuthState | null>(null);

export const useWalletAuth = () => {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider');
  }
  return context;
};

const WalletAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isDemoAccount, setIsDemoAccount] = useState(false);
  const [isDemoWallet, setIsDemoWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is using demo account
    const checkAccountType = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          setIsDemoAccount(tokenData.user?.type === 'demo');
        } catch (err) {
          console.error('Error parsing token:', err);
        }
      }
    };

    checkAccountType();
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAddress(accounts[0].address);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('MetaMask is not installed');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts && accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);
        setIsConnected(true);
        setIsDemoWallet(false);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setIsDemoWallet(false);
  };

  const useDemoWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Demo wallet address
      const demoAddress = '0xDEMO1234567890DeFiDashboardDemo1234567890';
      setAddress(demoAddress);
      setIsConnected(true);
      setIsDemoWallet(true);
      
    } catch (err) {
      console.error('Error using demo wallet:', err);
      setError('Failed to use demo wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    isConnected,
    address,
    isDemoAccount,
    isDemoWallet,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    useDemoWallet,
  };

  return (
    <WalletAuthContext.Provider value={value}>
      {children}
    </WalletAuthContext.Provider>
  );
};

export default WalletAuthProvider;