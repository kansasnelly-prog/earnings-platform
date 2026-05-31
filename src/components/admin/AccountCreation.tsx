import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';
import { Mail, UserPlus, Lock, GraduationCap, AlertCircle, CheckCircle, DollarSign, Send, Hash, RefreshCw, Database } from 'lucide-react';

interface AccountCreationProps {
  onAccountCreated: () => void;
}

const AccountCreation: React.FC<AccountCreationProps> = ({ onAccountCreated }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'training' | 'user'>('training');
  const [isCreating, setIsCreating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{ synced: number; failed: number; details: string[] } | null>(null);
  const personalReferralPattern = /^OPT-[A-Z0-9]{6}$/;
  
  // Training account form
  const [trainingEmail, setTrainingEmail] = useState('');
  const [trainingPassword, setTrainingPassword] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingReferral, setTrainingReferral] = useState('');
  
  // User account form
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userVipLevel, setUserVipLevel] = useState(1);
  const [userReferral, setUserReferral] = useState('');

  const sendTelegramNotification = async (message: string, timeoutMs = 10000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('/api/send-telegram-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        console.error('[Telegram] API returned error:', text);
        throw new Error(text || 'Failed to send Telegram notification');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[Telegram] Non-JSON response:', text);
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('[Telegram] API returned error:', data);
        throw new Error(data.error || 'Failed to send Telegram notification');
      }

      console.log('[Telegram] Notification sent successfully:', data);
      return data;
    } catch (error) {
      console.error('[Telegram] Notification error:', error);
      // Don't show toast for Telegram errors - they're non-blocking
      // Just log to console so admin can check if needed
    }
  };

  const createTrainingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate linked personal referral code format
    const normalizedTrainingReferral = trainingReferral.trim().toUpperCase();
    if (!personalReferralPattern.test(normalizedTrainingReferral)) {
      toast({ 
        title: 'Invalid Referral Code', 
        description: 'User Referral Code must match OPT-XXXXXX format',
        variant: 'destructive'
      });
      return;
    }
    
    setIsCreating(true);
    console.log('[AccountCreation] START - Training account creation started');

    try {
      // Validate referral code is provided
      if (!normalizedTrainingReferral) {
        toast({
          title: 'Validation Error',
          description: 'User referral code is required to create a training account',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      // Validate email and password are provided
      if (!trainingEmail || !trainingPassword) {
        toast({
          title: 'Validation Error',
          description: 'Email and password are required for training account',
          variant: 'destructive'
        });
        setIsCreating(false);
        return;
      }

      // Generate a unique tracking referral code for the training account
      const trackingReferralCode = `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Find the user associated with the provided referral code to link the account
      const { data: linkedUser, error: linkError } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', normalizedTrainingReferral)
        .maybeSingle();

      if (linkError) {
        throw new Error(`Error linking account: ${linkError.message}`);
      }

      const linkedToUserId = linkedUser?.id || 'Not Found';

      // Create user in Supabase Auth first with email confirmation disabled
      console.log('[AccountCreation] Creating user in Supabase Auth');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trainingEmail.toLowerCase(),
        password: trainingPassword,
        options: {
          emailRedirectTo: undefined,
          data: {
            display_name: trainingName,
          }
        }
      });

      if (authError) {
        console.error('[AccountCreation] Supabase Auth error:', authError);
        throw new Error(authError.message || 'Failed to create auth account');
      }

      const userId = authData.user?.id;
      if (!userId) {
        throw new Error('User ID not returned from Supabase Auth');
      }

      // Insert training account metadata into the database
      console.log('[AccountCreation] Inserting training account metadata into database');
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: trainingEmail.toLowerCase(),
          display_name: trainingName,
          account_type: 'training',
          vip_level: 2,
          tasks_completed: 0,
          balance: 1100,
          total_earned: 0,
          referral_code: trackingReferralCode,
          training_completed: false,
          training_phase: 1,
          user_status: 'active',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[AccountCreation] Database insert error:', insertError);
        throw new Error(insertError.message || 'Failed to insert training account into database');
      }

      console.log('[AccountCreation] Database insert success:', insertedUser);

      // Send Telegram notification for training account creation (non-blocking)
      const telegramMessage = `
🎓 <b>TRAINING ACCOUNT CREATED</b>

👤 <b>Training Account Details:</b>
📧 <b>Email:</b> ${trainingEmail}
🔑 <b>Password:</b> ${trainingPassword}
👤 <b>Name:</b> ${trainingName}
🏷️ <b>Account Type:</b> Training
💰 <b>Initial Balance:</b> $1100.00
📊 <b>Total Tasks:</b> 90 (45 per phase)
🎯 <b>Profit Rate:</b> 1% (Training Rate - Same as VIP2)
🔗 <b>Referral Code:</b> ${trackingReferralCode}
👥 <b>Linked to User ID:</b> ${linkedToUserId}
📅 <b>Created:</b> ${new Date().toLocaleString()}

📋 <b>Training Instructions:</b>
1. Login with provided credentials
2. Complete Phase 1: 45 tasks
3. Complete Phase 2: 45 tasks (includes combination order)
4. Complete training to unlock personal account

⚠️ <b>Important Notes:</b>
• Training account has its own Supabase Auth credentials
• Login works from any browser/device
• Progress tracked via referral code: ${trackingReferralCode}
• Admin can monitor completion status

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1`
      

      console.log('[AccountCreation] Sending Telegram notification');
     try {
      sendTelegramNotification(telegramMessage, 10000);
    } catch (telegramError) {
      console.error('[AccountCreation] First Telegram notification failed:', telegramError);
    }

      console.log('[AccountCreation] After first Telegram notification');

      // Send tracking notification for referral code usage (non-blocking)
      const trackingMessage = `
🎯 <b>TRAINING ACCOUNT TRACKED SUCCESSFULLY</b>

📊 <b>Tracking Information:</b>
👤 <b>User Referral Code:</b> ${trainingReferral}
🎓 <b>Training Account:</b> ${trainingEmail}
🔗 <b>Training Referral Code:</b> ${trackingReferralCode}
📅 <b>Tracked On:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Successfully linked and tracked
💾 <b>System:</b> Clean tracking activated
🔍 <b>Monitoring:</b> Progress will be tracked

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1`
      

      console.log('[AccountCreation] Before second Telegram notification');
      try {
        sendTelegramNotification(trackingMessage, 10000);
      } catch (telegramError) {
        console.error('[AccountCreation] Second Telegram notification failed:', telegramError);
      }
      console.log('[AccountCreation] After second Telegram notification');

      console.log('[AccountCreation] Before success toast');
      // Show success toast
      toast({
        title: 'Success',
        description: 'Training account created successfully',
        variant: 'default'
      });
      console.log('[AccountCreation] Success toast shown');
      
      // Reset form
      setTrainingEmail('');
      setTrainingPassword('');
      setTrainingName('');
      setTrainingReferral('');
      
      // Refresh data
      onAccountCreated();
      console.log('[AccountCreation] COMPLETE - Training account creation finished successfully');
      
    } catch (error: any) {
      console.log('[AccountCreation] STOP - Caught error in try-catch');
      console.error('Error creating training account:', error);
      let errorMessage = 'Unknown error';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      console.error('[AccountCreation] Detailed error:', JSON.stringify(error, null, 2));
      toast({
        title: 'Error',
        description: `Failed: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      console.log('[AccountCreation] FINALLY - Setting isCreating to false');
      setIsCreating(false);
    }
  };

  const createUserAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Generate referral code
      const referralCode = `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Check if user already exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail.toLowerCase())
        .maybeSingle();

      let data;
      let error;

      if (existingUser && !checkError) {
        console.log('[AccountCreation] User already exists, using existing record:', existingUser);
        data = existingUser;
        error = null;
      } else {
        // Create user account
        const result = await supabase
          .from('users')
          .insert({
            email: userEmail,
            // password removed - personal accounts should use Supabase Auth
            display_name: userName,
            account_type: 'personal',
            vip_level: userVipLevel,
            tasks_completed: 0,
            // tasks_total removed - column does not exist in database
            balance: 0,
            total_earned: 0,
            referral_code: referralCode,
            training_completed: true,
            user_status: 'active',
            // referred_by removed - column does not exist in database
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        data = result.data;
        error = result.error;

        // Handle duplicate key error gracefully
        if (error && error.code === '23505') {
          console.log('[AccountCreation] Duplicate key error, fetching existing user');
          const { data: fetchedUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', userEmail.toLowerCase())
            .single();
          data = fetchedUser;
          error = null;
        }
      }

      if (error) throw error;

      // Send Telegram notification
      const telegramMessage = `
👤 <b>NEW USER ACCOUNT CREATED</b>

� <b>Account Details:</b>
�📧 <b>Email:</b> ${userEmail}
� <b>Password:</b> ${userPassword}
�👤 <b>Name:</b> ${userName}
🏷️ <b>Account Type:</b> Personal
👑 <b>VIP Level:</b> VIP ${userVipLevel}
💰 <b>Initial Balance:</b> $0.00
📊 <b>Total Tasks:</b> ${userVipLevel === 1 ? 35 : 45}
🎯 <b>Profit Rate:</b> ${userVipLevel === 1 ? '0.5%' : '1%'}
🔗 <b>Referral Code:</b> ${referralCode}
${userReferral ? `� <b>Referred By:</b> ${userReferral}` : ''}
�📅 <b>Created:</b> ${new Date().toLocaleString()}

📋 <b>Account Instructions:</b>
1. Login with provided credentials
2. Complete ${userVipLevel === 1 ? 35 : 45} tasks
3. Submit products to earn profit
4. Withdraw earnings upon completion

💾 <b>TRACKING ENABLED:</b>
• This account is linked to referral code: ${referralCode}
${userReferral ? `• Referred by: ${userReferral}` : ''}
• User progress will be tracked by admin
• Can monitor completion status

🔗 <b>Contact User Support:</b> https://t.me/EARNINGSLLCONLINECS1
      `.trim();

      await sendTelegramNotification(telegramMessage);

      toast({
        title: 'Success',
        description: 'User account created successfully',
        variant: 'default'
      });
      
      // Reset form
      setUserEmail('');
      setUserPassword('');
      setUserName('');
      setUserVipLevel(1);
      setUserReferral('');
      
      // Refresh data
      onAccountCreated();
      
    } catch (error: any) {
      console.error('Error creating user account:', error);
      const errorMessage = error?.message || error?.error?.message || 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to create user account: ${errorMessage}`,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Function to sync localStorage accounts to database
  const syncLocalAccountsToDatabase = async () => {
    setIsSyncing(true);
    setSyncResults(null);
    
    const results = { synced: 0, failed: 0, details: [] as string[] };
    
    try {
      // Find all localStorage keys that start with opt_training_
      const keys = Object.keys(localStorage).filter(key => key.startsWith('opt_training_'));
      
      console.log(`[Sync] Found ${keys.length} training accounts in localStorage`);
      
      for (const key of keys) {
        try {
          const localData = JSON.parse(localStorage.getItem(key) || '{}');
          const email = localData.email;
          
          if (!email || !localData.password) {
            console.log(`[Sync] Skipping ${key} - missing email or password`);
            continue;
          }
          
          // Check if already exists in database
          const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle();
          
          if (existingUser) {
            console.log(`[Sync] Skipping ${email} - already exists in database`);
            results.details.push(`Skipped: ${email} (already in database)`);
            continue;
          }
          
          // Generate referral code if not present
          const referralCode = localData.trainingReferralCode || `TRN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          // Insert into database
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              email: email.toLowerCase(),
              // password removed - training accounts use localStorage for auth
              display_name: localData.assignedTo || 'Training User',
              account_type: 'training',
              vip_level: 2,
              tasks_completed: 0,
              // tasks_total removed - column does not exist in database
              balance: 1100,
              total_earned: 0,
              referral_code: referralCode,
              // referred_by removed - column does not exist in database
              training_completed: false,
              training_phase: 1,
              trigger_task_number: null,
              has_pending_order: false,
              pending_amount: 0,
              is_negative_balance: false,
              profit_added: false,
              user_status: 'active',
              created_at: localData.createdAt || new Date().toISOString()
            });

          // Handle duplicate key error gracefully
          if (insertError && insertError.code === '23505') {
            console.log(`[Sync] Duplicate key error for ${email}, skipping`);
            results.details.push(`Skipped: ${email} (duplicate)`);
          } else if (insertError) {
            console.error(`[Sync] Failed to sync ${email}:`, insertError);
            results.failed++;
            results.details.push(`Failed: ${email} - ${insertError.message}`);
          } else {
            console.log(`[Sync] Successfully synced ${email}`);
            results.synced++;
            results.details.push(`Synced: ${email}`);
          }
        } catch (syncError) {
          console.error(`[Sync] Error processing ${key}:`, syncError);
          results.failed++;
          results.details.push(`Error: ${key}`);
        }
      }
      
      setSyncResults(results);
      
      if (results.synced > 0) {
        toast({
          title: 'Sync Complete',
          description: `Synced ${results.synced} accounts to database. Failed: ${results.failed}`,
          variant: 'default'
        });
      } else if (results.failed === 0) {
        toast({
          title: 'No Accounts to Sync',
          description: 'All local accounts are already in the database or no accounts found.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: `Failed to sync ${results.failed} accounts. Check console for details.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('[Sync] Sync process error:', error);
      toast({
        title: 'Sync Error',
        description: 'An error occurred during sync. Check console.',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Creation <span className="text-xs text-green-400">v3-fixed</span></h2>
          <p className="text-slate-400">Create new training and user accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Account Creation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-green-500" />
              Create Training Account
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Create a new training account for users to complete training tasks
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTrainingAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={trainingEmail}
                  onChange={(e) => setTrainingEmail(e.target.value)}
                  placeholder="training@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={trainingName}
                  onChange={(e) => setTrainingName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  User Referral Code <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  value={trainingReferral}
                  onChange={(e) => setTrainingReferral(e.target.value.toUpperCase())}
                  placeholder="OPT-TYY1O6"
                  className={`bg-slate-700 border-slate-600 text-white ${
                    personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())
                      ? 'border-green-500 focus:border-green-400' 
                      : trainingReferral 
                        ? 'border-yellow-500 focus:border-yellow-400'
                        : 'border-red-500 focus:border-red-400'
                  }`}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())
                    ? '✓ Valid referral code format' 
                    : trainingReferral 
                      ? '⚠️ Referral code must match OPT-XXXXXX'
                      : 'Enter the user\'s referral code for tracking (mandatory)'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <Input
                  type="password"
                  value={trainingPassword}
                  onChange={(e) => setTrainingPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">Training Account Features:</p>
                    <ul className="text-green-300 text-xs space-y-1 mt-1">
                      <li>• 45 training tasks required</li>
                      <li>• 1% commission per task (Same as VIP2 Silver)</li>
                      <li>• Initial deposit: $1100</li>
                      <li>• Training completion tracking</li>
                      <li>• Telegram notification sent</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isCreating || !personalReferralPattern.test((trainingReferral || '').trim().toUpperCase())}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {!personalReferralPattern.test((trainingReferral || '').trim().toUpperCase()) 
                      ? 'Enter Valid Referral Code' 
                      : 'Create Training Account'}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User Account Creation */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-blue-500" />
              Create User Account
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Create a new personal user account with VIP features
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUserAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <UserPlus className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Password
                </label>
                <Input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  VIP Level
                </label>
                <select
                  value={userVipLevel}
                  onChange={(e) => setUserVipLevel(Number(e.target.value))}
                  className="w-full bg-slate-700 border-slate-600 text-white rounded px-3 py-2"
                >
                  <option value={1}>VIP 1 - 35 Tasks</option>
                  <option value={2}>VIP 2 - 45 Tasks</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Send className="w-4 h-4 inline mr-1" />
                  Referral Code (Optional)
                </label>
                <Input
                  type="text"
                  value={userReferral}
                  onChange={(e) => setUserReferral(e.target.value)}
                  placeholder="REF-123456"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 text-sm font-medium">User Account Features:</p>
                    <ul className="text-blue-300 text-xs space-y-1 mt-1">
                      <li>• VIP {userVipLevel}: {userVipLevel === 1 ? 35 : 45} tasks required</li>
                      <li>• {userVipLevel === 1 ? '0.5% profit per product' : '1% profit per product'}</li>
                      <li>• Earning capabilities</li>
                      <li>• Referral system supported</li>
                      <li>• Telegram notification sent</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create User Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Sync to Database Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-purple-500" />
            Sync Local Accounts to Database
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Push training accounts from this browser to the database so they work on any device
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-purple-400 text-sm font-medium">Why sync accounts?</p>
                  <ul className="text-purple-300 text-xs space-y-1 mt-1">
                    <li>• Accounts created before database fix only exist locally</li>
                    <li>• Syncing allows login from any device/browser</li>
                    <li>• Only accounts not already in database will be synced</li>
                    <li>• Check browser console for detailed sync logs</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={syncLocalAccountsToDatabase}
              disabled={isSyncing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Sync Local Accounts to Database
                </>
              )}
            </Button>

            {syncResults && (
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm font-medium text-white mb-2">Sync Results:</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-400">Synced: {syncResults.synced}</span>
                  <span className="text-red-400">Failed: {syncResults.failed}</span>
                </div>
                {syncResults.details.length > 0 && (
                  <div className="mt-2 max-h-32 overflow-y-auto text-xs text-slate-300 space-y-1">
                    {syncResults.details.map((detail, i) => (
                      <div key={i} className={
                        detail.startsWith('Synced') ? 'text-green-400' :
                        detail.startsWith('Failed') ? 'text-red-400' :
                        'text-yellow-400'
                      }>
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
            Account Creation Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Training Accounts</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 45 training tasks required</li>
                <li>• Free account (no VIP benefits)</li>
                <li>• Must complete training to upgrade</li>
                <li>• No earning until training completed</li>
                <li>• Telegram notification sent on creation</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">User Accounts</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• VIP 1: 35 tasks required</li>
                <li>• VIP 2: 45 tasks required</li>
                <li>• Can earn from completed tasks</li>
                <li>• Referral system supported</li>
                <li>• Telegram notification sent on creation</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-xs">
              <strong>Note:</strong> All account creations are logged and sent to Telegram for monitoring. 
              Each account receives a unique referral code for tracking purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountCreation;
