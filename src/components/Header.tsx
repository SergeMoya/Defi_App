import React, { useState } from 'react';
import { MoonIcon, SunIcon, BellIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/solid';
import { Transition } from '@headlessui/react';
import logoImage from '../assets/acare_logo.png';

const Header: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <img
                className="h-8 w-auto mr-2"
                src={logoImage}
                alt="Acare Dashboard"
              />
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
    </header>
  );
};

export default Header;