import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">E</span>
              <span className="text-gray-900 dark:text-white font-semibold">estrogen.email</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 px-3 py-2 rounded-md text-sm font-medium"
              >
                About
              </Link>
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="text-gray-900 dark:text-white hover:text-pink-600 dark:hover:text-pink-400 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{user}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 px-4 py-2 rounded-md hover:bg-pink-200 dark:hover:bg-pink-900/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;