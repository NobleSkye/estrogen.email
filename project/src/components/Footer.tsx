import React from 'react';
import { Github, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Footer = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
            <span>made by</span>
            <a
              href="https://github.com/nobleskye/estrogen.email"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>nobleskye</span>
            </a>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;