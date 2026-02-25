import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/context/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';

export function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const quickLoginUsers = [
    { id: 'USR-001', name: 'User 1', email: 'u1@lakeside.edu' },
    { id: 'USR-002', name: 'User 2', email: 'u2@lakeside.edu' },
    { id: 'USR-003', name: 'User 3', email: 'u3@lakeside.edu' },
    { id: 'USR-004', name: 'User 4', email: 'u4@lakeside.edu' }
  ];
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !password) {
      setError('Please enter both User ID and password');
      return;
    }

    setIsLoading(true);
    const success = await login(userId, password);
    setIsLoading(false);
    
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials. User ID can be name/ID, password should be email.');
    }
  };

  const handleQuickLogin = (name: string, email: string) => {
    setUserId(name);
    setPassword(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lakeside View University
          </h1>
          <p className="text-gray-600">
            Resource Visibility Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                User ID (Name or ID)
              </label>
              <input
                id="userId"
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Sarah Johnson or USR-001"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password (Email)
              </label>
              <input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="student@lakeside.edu"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Quick Login Demo */}
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">
            Quick Login (Demo)
          </h3>
          <p className="text-xs text-blue-700 mb-4">
            Click any user below to auto-fill credentials
          </p>
          <div className="space-y-2">
            {quickLoginUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleQuickLogin(user.name, user.email)}
                className="w-full text-left px-4 py-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-sm"
              >
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-xs text-gray-500">ID: {user.id} • Email: {user.email}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-4 text-center">
            User ID: Name or ID • Password: Email address
          </p>
        </div>
      </div>
    </div>
  );
}