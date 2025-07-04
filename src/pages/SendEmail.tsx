import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SendEmail = () => {
  const { user } = useAuth();
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setIsLoading(true);
    try {
      const res = await fetch('/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          from: user,
          subject,
          html: `<p>${body}</p>`,
          text: body,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('Email sent successfully!');
      } else {
        setStatus('Failed to send email: ' + data.error);
      }
    } catch (err) {
      setStatus('Error sending email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h2 className="text-2xl font-bold mb-4 text-center">Send Email</h2>
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block mb-1">To</label>
          <input type="email" value={to} onChange={e => setTo(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block mb-1">Subject</label>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block mb-1">Body</label>
          <textarea value={body} onChange={e => setBody(e.target.value)} required className="w-full p-2 border rounded" rows={5} />
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700">
          {isLoading ? 'Sending...' : 'Send Email'}
        </button>
      </form>
      {status && <div className="mt-4 text-center text-sm">{status}</div>}
    </div>
  );
};

export default SendEmail;
