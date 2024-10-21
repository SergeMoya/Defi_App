import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MainContent from './components/MainContent';
import Footer from './components/Footer';
import Authentication from './components/Authentication';

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
    <div className="flex flex-col min-h-screen">
      {token ? (
        <>
          <Header 
            isAuthenticated={true} 
            onLogout={handleLogout} 
            onDemoAuthSuccess={handleAuthSuccess} 
          />
          <MainContent />
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <Authentication onAuthSuccess={handleAuthSuccess} />
        </div>
      )}
      <Footer />
    </div>
  );
};

export default App;