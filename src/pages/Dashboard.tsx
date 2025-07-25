import React, { useState } from 'react';
import PageTransition from '../components/PageTransition';
import { useAuth } from '../context/AuthContext';
import { Mail, Star, Send, Inbox, Settings, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Email {
  id: string;
  title: string;
  sender: string;
  time: string;
  content: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const userObj = user ? JSON.parse(user) : null;
  const [aliases, setAliases] = useState<string[]>(() => {
    if (userObj && userObj.forwardingEmail) {
      return [userObj.forwardingEmail];
    }
    return [];
  });
  const [newAlias, setNewAlias] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const recentEmails: Email[] = [
    {
      id: '1',
      title: "HRT Prescription Update",
      sender: "Dr. Sarah Johnson",
      time: "2 hours ago",
      content: `Dear Patient,

I'm writing to confirm your recent HRT prescription has been renewed and sent to your preferred pharmacy. The dosage remains the same as previously discussed during your last appointment.

Please let me know if you have any questions or concerns.

Best regards,
Dr. Sarah Johnson
Gender Affirming Care Specialist`
    },
    {
      id: '2',
      title: "Support Group Meeting",
      sender: "Trans Support Network",
      time: "5 hours ago",
      content: `Hello everyone,

This is a reminder that our weekly support group meeting will be held this Thursday at 7 PM EST via Zoom.

This week's topic: "Navigating Family Relationships"
Guest Speaker: Alex Chen, LMFT

Looking forward to seeing you all there!

Best,
Trans Support Network Team`
    },
    {
      id: '3',
      title: "Insurance Coverage Update",
      sender: "Healthcare Admin",
      time: "Yesterday",
      content: `Important Update Regarding Your Coverage

We're pleased to inform you that your insurance plan has been updated to include additional gender-affirming care procedures. These changes will take effect from next month.

Please review the attached documentation for full details.

Best regards,
Healthcare Administration Team`
    }
  ];

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back!</h1>
            <span className="text-gray-600 dark:text-gray-300">{userObj?.email}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Forwarding Aliases</h2>
            <ul className="mb-2">
              {aliases.map((alias, i) => (
                <li key={i} className="text-pink-600 dark:text-pink-400">{alias}</li>
              ))}
            </ul>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (newAlias && !aliases.includes(newAlias + '@estrogen.email')) {
                  setAliases([...aliases, newAlias + '@estrogen.email']);
                  setNewAlias('');
                  // TODO: Call backend to set up forwarding for new alias
                }
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={newAlias}
                onChange={e => setNewAlias(e.target.value)}
                placeholder="New alias (username)"
                className="p-2 border rounded"
              />
              <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Add Alias</button>
            </form>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Username</h2>
            <div className="text-blue-600 dark:text-blue-400">{userObj?.username}</div>
          </div>

          <div className="mb-8">
            <a href="/send-email" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Compose/Send Email</a>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-pink-50 dark:bg-pink-900/20 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Inbox className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">23</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inbox</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">3 unread messages</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Star className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">5</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Starred</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Important messages</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Send className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">108</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sent</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Messages sent</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <Settings className="h-8 w-8 text-gray-600 dark:text-gray-300" />
                <span className="text-2xl font-bold text-gray-600 dark:text-gray-300">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Account preferences</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentEmails.map((email) => (
                <button
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="w-full text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded-lg"
                >
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{email.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">From: {email.sender}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{email.time}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedEmail && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEmail.title}</h2>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">From: {selectedEmail.sender}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEmail.time}</p>
                  </div>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200">
                      {selectedEmail.content}
                    </pre>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default Dashboard;