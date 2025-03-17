import React from 'react';
import { Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <span>made by</span>
          <a
            href="https://github.com/nobleskye/estrogen.email"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-pink-600 hover:text-pink-700 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>nobleskye</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;