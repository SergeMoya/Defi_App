import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletContextType {
  isWalletConnected: boolean;
  isUsingDemoWallet: boolean;
  walletAddress: string | null;
  connectWallet: () => Promise<void>;
  useDemoWallet: () => void;
  disconnectWallet: () => void;
  accountType: 'personal' | 'demo' | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isUsingDemoWallet, setIsUsingDemoWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<'personal' | 'demo' | null>(null);

  useEffect(() => {
    const storedAccountType = localStorage.getItem('accountType') as 'personal' | 'demo' | null;
    setAccountType(storedAccountType);

    const checkWalletConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts'
          }) as string[];
          
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setIsWalletConnected(false);
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
      }
    };

    checkWalletConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to connect a wallet');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];

      setWalletAddress(accounts[0]);
      setIsWalletConnected(true);
      setIsUsingDemoWallet(false);

      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const useDemoWallet = () => {
    setIsUsingDemoWallet(true);
    setWalletAddress('0xDEMO1234567890DeFiDashboardDemo1234567890');
    setIsWalletConnected(false);
    localStorage.setItem('isDemoWallet', 'true');
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setIsUsingDemoWallet(false);
    setWalletAddress(null);
    
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('isDemoWallet');
  };

  const value = {
    isWalletConnected,
    isUsingDemoWallet,
    walletAddress,
    connectWallet,
    useDemoWallet,
    disconnectWallet,
    accountType,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};