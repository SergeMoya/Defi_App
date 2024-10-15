import React, { useState, useEffect } from 'react';
import { Web3ReactProvider } from '@web3-react/core';
import { JsonRpcProvider } from '@ethersproject/providers';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import Authentication from './components/Authentication';

function getLibrary(provider: any): JsonRpcProvider {
  const library = new JsonRpcProvider(provider);
  library.pollingInterval = 12000;
  return library;
}

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="flex flex-col min-h-screen">
        <Header isAuthenticated={!!token} onLogout={handleLogout} />
        {token ? (
          <MainContent />
        ) : (
          <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <Authentication onAuthSuccess={handleAuthSuccess} />
          </div>
        )}
        <Footer />
      </div>
    </Web3ReactProvider>
  );
};

export default App;