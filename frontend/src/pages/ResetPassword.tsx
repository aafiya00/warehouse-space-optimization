import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm_password) {
      setError('Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await api.post('/accounts/reset-password/', { uid, token, new_password: form.new_password });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Password</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input type="password" value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            className="w-full border rounded px-3 py-2" required minLength={6} />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input type="password" value={form.confirm_password}
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
            className="w-full border rounded px-3 py-2" required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
        <p className="text-sm text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}