import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '', phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/accounts/register/', form);
      navigate('/login');
    } catch (err: any) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(' ');
        setError(messages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange}
              className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Username *</label>
          <input name="username" value={form.username} onChange={handleChange}
            className="w-full border rounded px-3 py-2" required />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            className="w-full border rounded px-3 py-2" required />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input name="phone" value={form.phone} onChange={handleChange}
            className="w-full border rounded px-3 py-2" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password *</label>
          <input type="password" name="password" value={form.password} onChange={handleChange}
            className="w-full border rounded px-3 py-2" required minLength={6} />
          <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="text-sm text-center mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}