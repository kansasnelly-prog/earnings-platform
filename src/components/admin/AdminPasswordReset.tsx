import React, { useState } from 'react';
import { Search, Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  display_name: string;
}

const AdminPasswordReset: React.FC = () => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name')
        .eq('email', searchEmail.toLowerCase().trim())
        .single();

      if (error || !data) {
        toast({
          title: 'User Not Found',
          description: 'No user found with that email address',
          variant: 'destructive',
        });
        return;
      }

      setSearchResult(data);
      toast({
        title: 'User Found',
        description: `Found: ${data.display_name || data.email}`,
      });
    } catch (error) {
      console.error('Error searching user:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search for user',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!searchResult || !newPassword.trim()) {
      toast({
        title: 'Error',
        description: 'Please search for a user and enter a new password',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'You must be logged in to perform this action',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'resetUserPassword',
          email: searchResult.email,
          password: newPassword,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to reset password');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        throw new Error('Server returned invalid response format');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      toast({
        title: 'Password Reset Successful',
        description: `Password has been updated for ${result.displayName || result.userEmail}`,
      });

      // Reset form
      setSearchEmail('');
      setSearchResult(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Password Reset Failed',
        description: (error as Error).message || 'Failed to reset password',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Password Reset</h2>
        <p className="text-gray-400 text-sm">Search for a user by email and reset their password</p>
      </div>

      {/* Search Section */}
      <Card className="bg-[#0a0e1a] border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search size={18} />
            Search User
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter user email address"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-[#060a14] border-white/10 text-white placeholder-gray-500"
              disabled={isSearching}
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSearching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} className="mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Search Result */}
          {searchResult && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="font-medium">User Found</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Display Name:</span>
                  <span className="text-white">{searchResult.display_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white">{searchResult.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span className="text-white font-mono text-xs">{searchResult.id}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Reset Section */}
      {searchResult && (
        <Card className="bg-[#0a0e1a] border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key size={18} />
              Reset Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">New Password</label>
              <Input
                type="password"
                placeholder="Enter new temporary password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#060a14] border-white/10 text-white placeholder-gray-500"
                disabled={isUpdating}
              />
              <p className="text-xs text-gray-500">
                The user will need to change this password after logging in
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    You are about to reset the password for <strong>{searchResult.display_name || searchResult.email}</strong>.
                    This action will be logged. Ensure you have authorization to perform this action.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePasswordReset}
              disabled={isUpdating || !newPassword.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isUpdating ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Key size={16} className="mr-2" />
              )}
              Update Password
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPasswordReset;
