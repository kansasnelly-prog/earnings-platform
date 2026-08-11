import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

function getAdminUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { error: 'No auth token', status: 401 };
  }

  const userClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  );

  const { data: { user }, error: userError } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));
  if (userError || !user) {
    return { error: 'Unauthorized user', status: 403 };
  }

  if (user.email !== process.env.ADMIN_EMAIL && user.email !== 'kansasnelly@gmail.com') {
    return { error: 'Not admin', status: 403 };
  }

  return { user };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, email, password, name, referralCode, userId, vipLevel } = req.body;
    const supabase = getSupabase();

    // Training account actions
    if (action === 'createTrainingAccount' || action === 'repairTrainingAccountAuth') {
      if (action === 'createTrainingAccount') {
        if (!email || !password || !name || !referralCode) {
          return res.status(400).json({ success: false, error: 'Email, password, name, and referral code are required' });
        }

        const { data: existingUser, error: userLookupError } = await supabase
          .from('users')
          .select('*')
          .eq('referral_code', referralCode)
          .single();

        if (userLookupError || !existingUser) {
          return res.status(404).json({ success: false, error: `No user found with referral code: ${referralCode}` });
        }

        const trackingReferralCode = existingUser.referral_code;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true,
          user_metadata: {
            display_name: name,
            account_type: 'training',
            linked_to_user_id: existingUser.id
          }
        });

        if (authError || !authData.user) {
          return res.status(400).json({ success: false, error: authError?.message || 'Failed to create auth user' });
        }

        const newAuthUserId = authData.user.id;
        const newReferralCode = 'TRN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const { error: userInsertError } = await supabase
          .from('users')
          .upsert({
            id: newAuthUserId,
            email: email.toLowerCase(),
            display_name: name,
            phone: null,
            account_type: 'training',
            user_status: 'active',
            vip_level: 2,
            referral_code: newReferralCode,
            training_completed: false,
            training_progress: 0,
            trigger_task_number: null,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            profit_added: false,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (userInsertError) {
          return res.status(500).json({ success: false, error: `Failed to create user profile: ${userInsertError.message}` });
        }

        const { data: newlyCreatedTrainingAccount, error: trainingError } = await supabase
          .from('training_accounts')
          .insert({
            auth_user_id: newAuthUserId,
            email: email.toLowerCase(),
            display_name: name,
            referral_code: newReferralCode,
            created_by: 'admin',
            assigned_to: 'admin',
            status: 'active'
          })
          .select()
          .single();

        if (trainingError) {
          return res.status(500).json({ success: false, error: `Failed to create training account: ${trainingError.message}` });
        }

        return res.status(200).json({
          success: true,
          message: 'Training account created successfully',
          data: {
            userId: newAuthUserId,
            email: email.toLowerCase(),
            trackingReferralCode: trackingReferralCode,
            linkedToUserId: existingUser.id
          }
        });
      }

      if (action === 'repairTrainingAccountAuth') {
        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const { data: trainingAccount, error: trainingError } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (trainingError || !trainingAccount) {
          return res.status(404).json({ success: false, error: 'Training account not found in database' });
        }

        const { data: publicUser, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (publicUserError || !publicUser) {
          return res.status(404).json({ success: false, error: 'Public user record not found in database' });
        }

        let authUserId = trainingAccount.auth_user_id || publicUser.id;
        let authUserExists = false;

        if (authUserId) {
          try {
            const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(authUserId);
            if (!authCheckError && authUser) {
              authUserExists = true;
            }
          } catch (checkError) {
            authUserExists = false;
          }
        }

        if (!authUserExists) {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email.toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
              display_name: trainingAccount.display_name || publicUser.display_name,
              account_type: 'training'
            }
          });

          if (authError || !authData.user) {
            return res.status(500).json({ success: false, error: 'Failed to create auth user', details: authError?.message });
          }

          authUserId = authData.user.id;

          await supabase
            .from('training_accounts')
            .update({ auth_user_id: authUserId })
            .eq('id', trainingAccount.id);

          if (publicUser.id !== authUserId) {
            await supabase
              .from('users')
              .delete()
              .eq('id', publicUser.id);

            await supabase
              .from('users')
              .insert({ ...publicUser, id: authUserId });
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Training account auth repaired successfully',
          data: {
            authUserId: authUserId,
            email: email.toLowerCase(),
            trainingAccountId: trainingAccount.id
          }
        });
      }
    }

    // Admin user actions
    const adminCheck = getAdminUser(req);
    if (adminCheck.error) {
      return res.status(adminCheck.status).json({ error: adminCheck.error });
    }

    switch (action) {
      case 'resetUserPassword':
        if (!email || !password) {
          return res.status(400).json({ error: 'Missing required fields: email, newPassword' });
        }

        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('id, email, display_name')
          .eq('email', email.toLowerCase())
          .single();

        if (fetchError || !userData) {
          return res.status(404).json({ error: 'User not found' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
          userData.id,
          { password: password }
        );

        if (updateError) {
          return res.status(500).json({ error: 'Failed to update password: ' + updateError.message });
        }

        return res.status(200).json({
          success: true,
          message: 'Password updated successfully',
          userEmail: userData.email,
          displayName: userData.display_name
        });

      case 'deleteUser':
        if (!userId) {
          return res.status(400).json({ error: 'Missing required field: userId' });
        }
        const { data: userDataDelete, error: fetchErrorDelete } = await supabase
          .from('users')
          .select('email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorDelete || !userDataDelete) {
          return res.status(404).json({ error: 'User not found' });
        }

        const { error: updateErrorDelete } = await supabase
          .from('users')
          .update({
            user_status: 'deleted',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorDelete) {
          return res.status(500).json({ error: 'Failed to delete user' });
        }
        return res.status(200).json({ success: true, message: 'User soft deleted successfully' });

      case 'freezeUser':
      case 'unfreezeUser':
        if (!userId) {
          return res.status(400).json({ error: 'Missing required field: userId' });
        }
        const isFrozen = action === 'freezeUser';
        const { data: userDataFreeze, error: fetchErrorFreeze } = await supabase
          .from('users')
          .select('is_frozen, email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorFreeze || !userDataFreeze) {
          return res.status(404).json({ error: 'User not found' });
        }

        const { error: updateErrorFreeze } = await supabase
          .from('users')
          .update({
            is_frozen: isFrozen,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorFreeze) {
          return res.status(500).json({ error: 'Failed to update freeze status' });
        }
        return res.status(200).json({ success: true, isFrozen, action });

      case 'updateVipLevel':
        if (!userId || vipLevel === undefined) {
          return res.status(400).json({ error: 'Missing required fields: userId, vipLevel' });
        }
        if (typeof vipLevel !== 'number' || vipLevel < 1 || vipLevel > 5) {
          return res.status(400).json({ error: 'VIP level must be between 1 and 5' });
        }
        const { data: userDataVip, error: fetchErrorVip } = await supabase
          .from('users')
          .select('vip_level, email, display_name')
          .eq('id', userId)
          .single();

        if (fetchErrorVip || !userDataVip) {
          return res.status(404).json({ error: 'User not found' });
        }

        const previousVipLevel = userDataVip.vip_level || 1;
        const { error: updateErrorVip } = await supabase
          .from('users')
          .update({
            vip_level: vipLevel,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateErrorVip) {
          return res.status(500).json({ error: 'Failed to update VIP level' });
        }
        return res.status(200).json({ success: true, previousVipLevel, newVipLevel: vipLevel });

      default:
        return res.status(400).json({ error: 'Invalid action provided' });
    }
  } catch (error) {
    console.error('Error in admin API:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
