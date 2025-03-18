import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-pink-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
          <p className="text-xl text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700"
          >
            Go back home
          </Link>
        </div>
      </div>
    </PageTransition>
  );
};

export default NotFound;