import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { SupabaseService, DatabaseUser, DatabaseTask, generateReferralCode } from '../../services/supabaseService';
import { SecurityManager } from '../../utils/security';
import { supabase } from '../../lib/supabase';

interface SupabaseAccountCreationProps {
  onSuccess?: () => void;
  onRefresh?: () => void;
}

const SupabaseAccountCreation: React.FC<SupabaseAccountCreationProps> = ({ 
  onSuccess, 
  onRefresh 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Training account form
  const [trainingEmail, setTrainingEmail] = useState('');
  const [trainingPassword, setTrainingPassword] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [trainingReferral, setTrainingReferral] = useState('');
  
  // Personal account form
  const [personalEmail, setPersonalEmail] = useState('');
  const [personalPassword, setPersonalPassword] = useState('');
  const [personalName, setPersonalName] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [personalReferral, setPersonalReferral] = useState('');
  const personalReferralPattern = /^OPT-[A-Z0-9]{6}$/;

  // Create training account
  const createTrainingAccount = async () => {
    if (!trainingEmail || !trainingPassword || !trainingName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!trainingEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    const normalizedTrainingReferral = trainingReferral.trim().toUpperCase();
    if (!personalReferralPattern.test(normalizedTrainingReferral)) {
      toast.error('User referral code must match OPT-XXXXXX format');
      return;
    }

    setIsCreating(true);
    try {
      // Validate referral code is provided
      if (!normalizedTrainingReferral) {
        toast.error('User referral code is required to create a training account');
        setIsCreating(false);
        return;
      }

      // Validate email and password are provided
      if (!trainingEmail || !trainingPassword) {
        toast.error('Email and password are required for training account');
        setIsCreating(false);
        return;
      }

      // STEP 1: Find the existing user in public.users using the provided referral_code (for tracking)
      console.log('STEP 1: Finding existing user by referral_code:', normalizedTrainingReferral);
      const { data: existingUser, error: userLookupError } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', normalizedTrainingReferral)
        .single();

      if (userLookupError || !existingUser) {
        console.error('[createTrainingAccount] User not found with referral_code:', userLookupError);
        toast.error(`No user found with referral code: ${normalizedTrainingReferral}`);
        setIsCreating(false);
        return;
      }

      console.log('STEP 1: Existing user found for tracking:', existingUser.id, existingUser.email);
      const trackingReferralCode = existingUser.referral_code;

      // STEP 2: Call API route to create training account with service role key
      console.log('STEP 2: Calling API route to create training account');
      const response = await fetch('/api/create-training-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: trainingEmail,
          password: trainingPassword,
          name: trainingName,
          referralCode: normalizedTrainingReferral
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[createTrainingAccount] API route error:', text);
        toast.error(text || 'Failed to create training account');
        setIsCreating(false);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[createTrainingAccount] Non-JSON response:', text);
        toast.error('Server returned invalid response format');
        setIsCreating(false);
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        console.error('[createTrainingAccount] API route error:', result);
        toast.error(result.error || 'Failed to create training account');
        setIsCreating(false);
        return;
      }

      console.log('STEP 2: Training account created via API route:', result);
      const authUserId = result.data.userId;

      // Log admin action
      SecurityManager.logAction('CREATE_TRAINING_ACCOUNT', trainingEmail, {
        userId: authUserId,
        referralCode: trackingReferralCode,
        linkedReferral: trainingReferral
      });

      // Send detailed Telegram notification (don't block on failure)
      console.log('[Telegram] New account notification started');
      try {
        const response = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sendNotification',
            message: `🎉 <b>New Account Created</b>\n\n` +
              `👤 <b>User Details:</b>\n` +
              `🆔 ID: <code>${authUserId}</code>\n` +
              `📧 Email: ${trainingEmail.toLowerCase()}\n` +
              `🏷️ Name: ${trainingName}\n` +
              `🏢 Account Type: TRAINING\n` +
              `⭐ VIP Level: 2\n` +
              `💰 Balance: $1100.00\n` +
              `🔗 Referral Code: <code>${trackingReferralCode}</code>\n` +
              `📊 Status: active\n` +
              `🕐 Created: ${new Date().toLocaleString()}\n\n` +
              `📚 <b>Training Account Details:</b>\n` +
              `✅ Training Account: Yes\n` +
              `💵 Training Balance: $1100.00\n` +
              `📋 Current Task: 1 of 45\n` +
              `🎯 Total Tasks: 45\n` +
              `🔗 Linked to User: <code>${existingUser.id}</code>\n` +
              `👥 Linked Referral: ${trainingReferral}\n\n` +
              `🌐 Domain: earnings.ink`
          })
        });
        
        if (response.ok) {
          console.log('[Telegram] New account notification sent');
        } else {
          console.error('[Telegram] New account notification failed:', await response.text());
        }
      } catch (telegramError) {
        console.error('[Telegram] New account notification failed:', telegramError);
        // Don't block account creation if Telegram fails
      }

      toast.success('Training account created successfully!');

      // Reset form
      setTrainingEmail('');
      setTrainingPassword('');
      setTrainingName('');
      setTrainingReferral('');

      onSuccess?.();
      onRefresh?.();

    } catch (error) {
      console.error('Error creating training account:', error);
      toast.error('Failed to create training account');
    } finally {
      setIsCreating(false);
    }
  };

  // Create personal account
  const createPersonalAccount = async () => {
    if (!personalEmail || !personalPassword || !personalName) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!personalEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsCreating(true);
    try {
      // Generate personal referral code
      const referralCode = generateReferralCode();

      // Create user in Supabase Auth (passwords hashed by Supabase)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personalEmail.toLowerCase(),
        password: personalPassword,
        options: {
          data: {
            display_name: personalName,
            phone: personalPhone || null,
            account_type: 'personal'
          }
        }
      });

      if (authError || !authData.user) {
        toast.error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`);
        setIsCreating(false);
        return;
      }

      const authUserId = authData.user.id;

      // Check if user already exists in users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${personalEmail.toLowerCase()},id.eq.${authUserId}`)
        .maybeSingle();

      let userRecord;
      let userError;

      if (existingUser && !checkError) {
        console.log('[SupabaseAccountCreation] User already exists, using existing record:', existingUser);
        userRecord = existingUser;
        userError = null;
      } else {
        // Create user record in users table linked to auth user
        const result = await supabase
          .from('users')
          .insert({
            id: authUserId,
            email: personalEmail.toLowerCase(),
            display_name: personalName,
            phone: personalPhone || null,
            account_type: 'personal',
            user_status: 'active',
            vip_level: 1,
            balance: 0,
            total_earned: 0,
            referral_code: referralCode,
            referred_by: personalReferral || null,
            training_completed: false,
            training_progress: 0,
            training_phase: 1,
            tasks_completed: 0,
            trigger_task_number: null,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: false,
            pending_product: null
          })
          .select()
          .single();

        userRecord = result.data;
        userError = result.error;

        // Handle duplicate key error gracefully
        if (userError && userError.code === '23505') {
          console.log('[SupabaseAccountCreation] Duplicate key error, fetching existing user');
          const { data: fetchedUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUserId)
            .single();
          userRecord = fetchedUser;
          userError = null;
        }
      }

      if (userError || !userRecord) {
        toast.error(`Failed to create user record: ${userError?.message || 'Unknown error'}`);
        setIsCreating(false);
        return;
      }

      // Log admin action
      SecurityManager.logAction('CREATE_PERSONAL_ACCOUNT', personalEmail, {
        userId: authUserId,
        referralCode,
        linkedReferral: personalReferral
      });

      // Send detailed Telegram notification (don't block on failure)
      console.log('[Telegram] New account notification started');
      try {
        const response = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sendNotification',
            message: `🎉 <b>New Account Created</b>\n\n` +
              `👤 <b>User Details:</b>\n` +
              `🆔 ID: <code>${authUserId}</code>\n` +
              `📧 Email: ${personalEmail.toLowerCase()}\n` +
              `🏷️ Name: ${personalName}\n` +
              `🏢 Account Type: PERSONAL\n` +
              `⭐ VIP Level: 1\n` +
              `💰 Balance: $0.00\n` +
              `🔗 Referral Code: <code>${referralCode}</code>\n` +
              `📊 Status: active\n` +
              `🕐 Created: ${new Date().toLocaleString()}\n` +
              `${personalPhone ? `📱 Phone: ${personalPhone}\n` : ''}` +
              `${personalReferral ? `👥 Referred by: ${personalReferral}\n` : ''}` +
              `\n🌐 Domain: earnings.ink`
          })
        });
        
        if (response.ok) {
          console.log('[Telegram] New account notification sent');
        } else {
          console.error('[Telegram] New account notification failed:', await response.text());
        }
      } catch (telegramError) {
        console.error('[Telegram] New account notification failed:', telegramError);
        // Don't block account creation if Telegram fails
      }

      toast.success('Personal account created successfully!');

      // Reset form
      setPersonalEmail('');
      setPersonalPassword('');
      setPersonalName('');
      setPersonalPhone('');
      setPersonalReferral('');

      onSuccess?.();
      onRefresh?.();

    } catch (error) {
      console.error('Error creating personal account:', error);
      toast.error('Failed to create personal account');
    } finally {
      setIsCreating(false);
    }
  };

  // Send Telegram notification
  const sendTelegramNotification = async (type: 'training' | 'personal', data: any) => {
    try {
      const message = type === 'training' ? `
🎓 <b>TRAINING ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${data.email}
🔑 <b>Password:</b> ${data.password}
👤 <b>Name:</b> ${data.name}
🏷️ <b>Account Type:</b> Training
💰 <b>Initial Balance:</b> $1100.00
📊 <b>Total Tasks:</b> 90 (45 per phase)
🎯 <b>Profit Rate:</b> 1% (Training Rate - Same as VIP2)
🔗 <b>Training Referral Code:</b> ${data.referralCode}
👥 <b>Linked to User Referral:</b> ${data.linkedReferral}
📅 <b>Created:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Account created and stored in database
🔄 <b>Synchronization:</b> Real-time updates enabled
🔒 <b>Security:</b> Server-side validation active
      ` : `
👤 <b>PERSONAL ACCOUNT CREATED</b>

👤 <b>User Details:</b>
📧 <b>Email:</b> ${data.email}
🔑 <b>Password:</b> ${data.password}
👤 <b>Name:</b> ${data.name}
📱 <b>Phone:</b> ${data.phone || 'Not provided'}
🏷️ <b>Account Type:</b> Personal
💰 <b>Initial Balance:</b> $0.00
📊 <b>Total Tasks:</b> 35
🎯 <b>VIP Level:</b> 1
🔗 <b>Referral Code:</b> ${data.referralCode}
👥 <b>Linked to User Referral:</b> ${data.linkedReferral}
📅 <b>Created:</b> ${new Date().toLocaleString()}

✅ <b>Status:</b> Account created and stored in database
🔄 <b>Synchronization:</b> Real-time updates enabled
🔒 <b>Security:</b> Server-side validation active
      `;

      // Call Telegram bot edge function
      const { error } = await supabase.functions.invoke('telegram-bot', {
        body: { message }
      });

      if (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Training Account Creation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="w-5 h-5 bg-blue-500 rounded-full mr-2"></div>
            Create Training Account
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Create new training accounts with server-side validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="training-email" className="text-slate-300">Email Address</Label>
              <Input
                id="training-email"
                type="email"
                value={trainingEmail}
                onChange={(e) => setTrainingEmail(e.target.value)}
                placeholder="training@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="training-password" className="text-slate-300">Password</Label>
              <Input
                id="training-password"
                type="password"
                value={trainingPassword}
                onChange={(e) => setTrainingPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="training-name" className="text-slate-300">Full Name</Label>
              <Input
                id="training-name"
                value={trainingName}
                onChange={(e) => setTrainingName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="training-referral" className="text-slate-300">User Referral Code</Label>
              <Input
                id="training-referral"
                value={trainingReferral}
                onChange={(e) => setTrainingReferral(e.target.value.toUpperCase())}
                placeholder="OPT-ABC123"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <Button
            onClick={createTrainingAccount}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-white rounded-full mr-2"></div>
                Create Training Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Personal Account Creation */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className="w-5 h-5 bg-green-500 rounded-full mr-2"></div>
            Create Personal Account
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Create new personal accounts with server-side validation
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="personal-email" className="text-slate-300">Email Address</Label>
              <Input
                id="personal-email"
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="personal-password" className="text-slate-300">Password</Label>
              <Input
                id="personal-password"
                type="password"
                value={personalPassword}
                onChange={(e) => setPersonalPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="personal-name" className="text-slate-300">Full Name</Label>
              <Input
                id="personal-name"
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="personal-phone" className="text-slate-300">Phone Number</Label>
              <Input
                id="personal-phone"
                value={personalPhone}
                onChange={(e) => setPersonalPhone(e.target.value)}
                placeholder="+1234567890"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="personal-referral" className="text-slate-300">Referral Code (Optional)</Label>
            <Input
              id="personal-referral"
              value={personalReferral}
              onChange={(e) => setPersonalReferral(e.target.value)}
              placeholder="Enter referral code"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <Button
            onClick={createPersonalAccount}
            disabled={isCreating}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating Account...
              </>
            ) : (
              <>
                <div className="w-4 h-4 bg-white rounded-full mr-2"></div>
                Create Personal Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <p className="text-green-400 text-sm font-medium">Database Status: Connected</p>
              <p className="text-green-300 text-xs">All accounts are stored in Supabase with real-time synchronization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseAccountCreation;
