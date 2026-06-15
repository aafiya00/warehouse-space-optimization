import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await api.post('/accounts/change-password/', {
        old_password: form.old_password,
        new_password: form.new_password,
      });
      setSuccess('Password changed successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Change Password</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        {success && <p className="text-green-600 mb-4 text-sm">{success}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Current Password</label>
          <input type="password" name="old_password" value={form.old_password}
            onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">New Password</label>
          <input type="password" name="new_password" value={form.new_password}
            onChange={handleChange} className="w-full border rounded px-3 py-2" required minLength={6} />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Confirm New Password</label>
          <input type="password" name="confirm_password" value={form.confirm_password}
            onChange={handleChange} className="w-full border rounded px-3 py-2" required />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Updating...' : 'Change Password'}
        </button>
        <p className="text-sm text-center mt-4">
          <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </p>
      </form>
    </div>
  );
}