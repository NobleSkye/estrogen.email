import React from 'react';
import PageTransition from '../components/PageTransition';
import { Heart, Sparkles, Laugh } from 'lucide-react';

const About = () => {
  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <Heart className="h-12 w-12 text-pink-600" />
              <Sparkles className="h-8 w-8 text-pink-400" />
              <Laugh className="h-12 w-12 text-pink-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About This Project</h1>
            <p className="text-xl text-gray-600">
              A fun and playful take on email clients!
            </p>
          </div>
          
          <div className="prose prose-pink mx-auto">
            <div className="bg-pink-50 p-6 rounded-lg mb-8">
              <h2 className="text-2xl font-semibold text-pink-700 mb-4 mt-0">
                🎉 Just For Fun!
              </h2>
              <p className="text-lg text-pink-900 mb-0">
                Hey there! Just to be crystal clear - this isn't a real email service.
                It's a fun demo project that imagines what a trans-friendly email client
                might look like. Think of it as a creative exploration with a dash of humor! 
              </p>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              What's This All About?
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              estrogen.email is a playful concept that combines:
            </p>
            <ul className="list-disc list-inside text-lg text-gray-700 mb-6">
              <li className="mb-2">A dash of creativity 🎨</li>
              <li className="mb-2">I own this domain for some emails</li>
              <li className="mb-2">Instead of leaving it on the landing page i made something out of it</li>
            </ul>
            
            <div className="bg-purple-50 p-6 rounded-lg mt-8">
              <h2 className="text-2xl font-semibold text-purple-700 mb-4 mt-0">
                The Fine Print
              </h2>
              <p className="text-lg text-purple-900 mb-2">
                This is a 'demo' project for my email (skylar@estrogen.email (real email)) and I wanted to make something out of the domain besides just for emails, and leaving the landing page empty
              </p>
              <p className="text-lg text-purple-900 mb-0">
                
              </p>
              <p className="text-lg text-purple-900 mb-0">
                So feel free to play around, log in with any "@estrogen.email" address
                (its not a real email client), but explore the interface. It's all about having fun
                while showcasing some web development skills!
              </p>
            </div>
            
            <div className="text-center mt-12">
              <p className="text-xl text-gray-600 italic">
                "Sometimes the best projects are the ones that make us smile! 💝"
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default About;