import React from 'react';
import PageTransition from '../components/PageTransition';
import { Mail } from 'lucide-react';

const Home = () => {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Mail className="h-16 w-16 text-pink-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to estrogen.email
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your secure and inclusive email platform
          </p>
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Secure Communication</h3>
              <p className="text-gray-600">
                End-to-end encryption ensures your conversations remain private and secure.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Inclusive Design</h3>
              <p className="text-gray-600">
                Built with accessibility and inclusivity in mind for all users.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4">Community Focused</h3>
              <p className="text-gray-600">
                Join a supportive community of users who share similar experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Home;