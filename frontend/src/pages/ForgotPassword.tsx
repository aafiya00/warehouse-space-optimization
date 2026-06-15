import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/accounts/forgot-password/', { email });
      setMessage('If this email exists, a reset link has been sent. Check your inbox.');
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Forgot Password</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Enter your email and we'll send a reset link.
        </p>
        {message && <p className="text-green-600 mb-4 text-sm">{message}</p>}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2" required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <p className="text-sm text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}