import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, AlertTriangle, Mail } from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });

      if (authError) {
        setError(authError.message || 'Invalid credentials');
        return;
      }

      if (!data.user) {
        setError('Failed to authenticate user');
        return;
      }

      // Verify user is admin from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_type, user_status')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        setError('User record not found');
        return;
      }

      if (userData.account_type !== 'admin') {
        await supabase.auth.signOut();
        setError('You do not have admin privileges');
        return;
      }

      // Redirect to admin panel
      navigate('/admin/command-center');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-gray-400">Optimize Tasks Administration</p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-white font-semibold mb-3">Admin Credentials:</h3>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-300">Owner:</div>
              <div className="text-white font-mono">owner@optimize.com / OwnerAdmin2025!</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-300">Admin:</div>
              <div className="text-white font-mono">admin@optimize.com / Admin2025!</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-300">Support:</div>
              <div className="text-white font-mono">support@optimize.com / Support2025!</div>
            </div>
            <div className="p-2 bg-gray-700 rounded">
              <div className="text-gray-300">Reviewer:</div>
              <div className="text-white font-mono">reviewer@optimize.com / Reviewer2025!</div>
            </div>
          </div>
          <Alert className="mt-3 bg-yellow-500/10 border-yellow-500/20">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400 text-xs">
              These are demo credentials. In production, use secure authentication.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
