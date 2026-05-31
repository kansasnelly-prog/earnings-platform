
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { action, email, password, name, referralCode } = req.body;

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[TrainingManagement] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({
      success: false,
      error: 'Server configuration missing'
    });
  }

  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (initError) {
    console.error('[TrainingManagement] Failed to initialize Supabase client:', initError);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize database connection'
    });
  }

  try {
    switch (action) {
      case 'createTrainingAccount':
        if (!email || !password || !name || !referralCode) {
          return res.status(400).json({
            success: false,
            error: 'Email, password, name, and referral code are required'
          });
        }

        console.log('[CreateTrainingAccount] Starting account creation for:', email);

        // STEP 1: Find the existing user in public.users using the provided referral_code
        console.log('[CreateTrainingAccount] STEP 1: Finding existing user by referral_code:', referralCode);
        const { data: existingUser, error: userLookupError } = await supabase
          .from('users')
          .select('*')
          .eq('referral_code', referralCode)
          .single();

        if (userLookupError || !existingUser) {
          console.error('[CreateTrainingAccount] User not found with referral_code:', userLookupError);
          return res.status(404).json({
            success: false,
            error: `No user found with referral code: ${referralCode}`
          });
        }

        console.log('[CreateTrainingAccount] STEP 1: Existing user found for tracking:', existingUser.id, existingUser.email);
        const trackingReferralCode = existingUser.referral_code;

        // STEP 2: Create Supabase Auth user for the training account
        console.log('[CreateTrainingAccount] STEP 2: Creating Supabase Auth user for training account');
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
          console.error('[CreateTrainingAccount] Supabase auth creation error:', authError);
          return res.status(400).json({
            success: false,
            error: authError?.message || 'Failed to create auth user'
          });
        }

        console.log('[CreateTrainingAccount] STEP 2: Auth user created:', authData.user.id);
        const newAuthUserId = authData.user.id;

        // Generate new referral code for training account
        const newReferralCode = 'TRN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        // STEP 3: Insert into public.users table for the training account
        console.log('[CreateTrainingAccount] STEP 3: Inserting into public.users for training account');
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
          console.error('[CreateTrainingAccount] Public users upsert error:', userInsertError);
          return res.status(500).json({
            success: false,
            error: `Failed to create user profile: ${userInsertError.message}`
          });
        }
        console.log('[CreateTrainingAccount] STEP 3: public.users inserted');

        // STEP 4: Check if training account already exists for this auth_user_id
        console.log('[CreateTrainingAccount] STEP 4: Checking if training account exists for user:', newAuthUserId);
        const { data: existingTrainingAccount, error: checkTrainingError } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', newAuthUserId)
          .maybeSingle();

        let newTrainingAccount;

        if (existingTrainingAccount && !checkTrainingError) {
          console.log('[CreateTrainingAccount] STEP 4: Training account already exists, reusing:', existingTrainingAccount);
          newTrainingAccount = existingTrainingAccount;
        } else {
          // Insert into training_accounts table with minimal fields - let database handle defaults
          console.log('[CreateTrainingAccount] STEP 4: Inserting into training_accounts');
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
            console.error('[CreateTrainingAccount] Training account insert failed:', trainingError);
            return res.status(500).json({
              success: false,
              error: `Failed to create training account: ${trainingError.message}`
            });
          }

          console.log('[CreateTrainingAccount] STEP 4: Training account created:', newlyCreatedTrainingAccount);
          newTrainingAccount = newlyCreatedTrainingAccount;
        }

        // STEP 5: Create tasks for the new training account
        console.log('[CreateTrainingAccount] STEP 5: Creating tasks for training account');
        try {
          const { data: trainingProducts, error: productsError } = await supabase
            .from('training_products')
            .select('product_number, price')
            .order('product_number', { ascending: true });

          if (productsError) {
            console.error('[CreateTrainingAccount] Failed to fetch training products:', productsError);
          } else if (trainingProducts && trainingProducts.length > 0) {
            console.log('[CreateTrainingAccount] Found', trainingProducts.length, 'training products');

            const tasksToInsert = trainingProducts.map(product => ({
              user_id: newAuthUserId,
              task_number: product.product_number,
              status: 'locked',
              reward: product.price * 0.01,
              created_at: new Date().toISOString()
            }));

            const { error: tasksInsertError } = await supabase
              .from('tasks')
              .insert(tasksToInsert);

            if (tasksInsertError) {
              console.error('[CreateTrainingAccount] Failed to create tasks:', tasksInsertError);
            } else {
              console.log('[CreateTrainingAccount] Successfully created', tasksToInsert.length, 'tasks for user');
            }
          }
        } catch (taskError) {
          console.error('[CreateTrainingAccount] Error during task creation:', taskError);
        }

        console.log('[CreateTrainingAccount] COMPLETE - Training account creation finished successfully');

        // Send Telegram notification for new training account (don't block on failure)
        console.log('[Telegram] New account notification started');
        try {
          const message = `🎉 <b>New Account Created</b>\n\n` +
            `👤 <b>User Details:</b>\n` +
            `🆔 ID: <code>${newAuthUserId}</code>\n` +
            `📧 Email: ${email.toLowerCase()}\n` +
            `🏷️ Name: ${name}\n` +
            `🏢 Account Type: TRAINING\n` +
            `⭐ VIP Level: 2\n` +
            `💰 Balance: $1100.00\n` +
            `🔗 Referral Code: <code>${newReferralCode}</code>\n` +
            `📊 Status: active\n` +
            `🕐 Created: ${new Date().toLocaleString()}\n\n` +
            `📚 <b>Training Account Details:</b>\n` +
            `✅ Training Account: Yes\n` +
            `💵 Training Balance: $1100.00\n` +
            `📋 Current Task: 1 of 45\n` +
            `🎯 Total Tasks: 45\n` +
            `🔗 Linked to User: <code>${existingUser.id}</code>\n\n` +
            `🌐 Domain: earnings.ink`;

          const supabaseUrl = process.env.VITE_SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data, error } = await supabase.functions.invoke('telegram-bot', {
              body: { message }
            });

            if (error) {
              console.error('[Telegram] New account notification via Edge Function failed:', error);
            } else {
              console.log('[Telegram] New account notification sent successfully via Edge Function');
            }
          } else {
            console.warn('[Telegram] Missing Supabase configuration for Edge Function');
          }
        } catch (telegramError) {
          console.error('[Telegram] New account notification failed:', telegramError);
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

      case 'repairTrainingAccountAuth':
        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Email and password are required'
          });
        }

        console.log('[RepairTrainingAccount] Starting repair for:', email);

        // STEP 1: Find existing training account record
        console.log('[RepairTrainingAccount] STEP 1: Finding training account by email');
        const { data: trainingAccount, error: trainingError } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (trainingError) {
          console.error('[RepairTrainingAccount] Error finding training account:', trainingError);
          return res.status(404).json({
            success: false,
            error: 'Training account not found in database'
          });
        }

        if (!trainingAccount) {
          return res.status(404).json({
            success: false,
            error: 'No training account found with this email'
          });
        }

        console.log('[RepairTrainingAccount] Training account found:', trainingAccount.id, 'auth_user_id:', trainingAccount.auth_user_id);

        // STEP 2: Find corresponding public.users record
        console.log('[RepairTrainingAccount] STEP 2: Finding public.users record');
        const { data: publicUser, error: publicUserError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle();

        if (publicUserError || !publicUser) {
          console.error('[RepairTrainingAccount] Error finding public user:', publicUserError);
          return res.status(404).json({
            success: false,
            error: 'Public user record not found in database'
          });
        }

        console.log('[RepairTrainingAccount] Public user found:', publicUser.id);

        // STEP 3: Check if auth user exists in Supabase Auth
        console.log('[RepairTrainingAccount] STEP 3: Checking if auth user exists in Supabase Auth');
        let authUserId = trainingAccount.auth_user_id || publicUser.id;
        let authUserExists = false;

        if (authUserId) {
          try {
            const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(authUserId);
            if (!authCheckError && authUser) {
              authUserExists = true;
              console.log('[RepairTrainingAccount] Auth user exists:', authUserId);
            }
          } catch (checkError) {
            console.log('[RepairTrainingAccount] Auth user does not exist or is invalid:', authUserId);
            authUserExists = false;
          }
        }

        // STEP 4: If auth user doesn't exist, create it
        if (!authUserExists) {
          console.log('[RepairTrainingAccount] STEP 4: Creating new auth user for existing training account');

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
            console.error('[RepairTrainingAccount] Failed to create auth user:', authError);
            return res.status(500).json({
              success: false,
              error: 'Failed to create auth user',
              details: authError?.message
            });
          }

          authUserId = authData.user.id;
          console.log('[RepairTrainingAccount] New auth user created:', authUserId);

          // STEP 5: Update training_accounts table with new auth_user_id
          console.log('[RepairTrainingAccount] STEP 5: Updating training_accounts with new auth_user_id');
          const { error: trainingUpdateError } = await supabase
            .from('training_accounts')
            .update({ auth_user_id: authUserId })
            .eq('id', trainingAccount.id);

          if (trainingUpdateError) {
            console.error('[RepairTrainingAccount] Failed to update training_accounts:', trainingUpdateError);
            return res.status(500).json({
              success: false,
              error: 'Failed to update training_accounts record',
              details: trainingUpdateError.message
            });
          }

          // STEP 6: Update public.users table with new id if needed
          if (publicUser.id !== authUserId) {
            console.log('[RepairTrainingAccount] STEP 6: Updating public.users with new auth_user_id');

            // Delete old record and insert new one with correct id
            const { error: deleteError } = await supabase
              .from('users')
              .delete()
              .eq('id', publicUser.id);

            if (deleteError) {
              console.error('[RepairTrainingAccount] Failed to delete old public user record:', deleteError);
            }

            // Insert new record with correct auth user id
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                ...publicUser,
                id: authUserId
              });

            if (insertError) {
              console.error('[RepairTrainingAccount] Failed to insert new public user record:', insertError);
              return res.status(500).json({
                success: false,
                error: 'Failed to update public.users record',
                details: insertError.message
              });
            }
          }
        } else {
          console.log('[RepairTrainingAccount] Auth user already exists, no creation needed');
        }

        console.log('[RepairTrainingAccount] Repair completed successfully for:', email);

        return res.status(200).json({
          success: true,
          message: 'Training account auth repaired successfully',
          data: {
            authUserId: authUserId,
            email: email.toLowerCase(),
            trainingAccountId: trainingAccount.id
          }
        });

      default:
        return res.status(400).json({ error: 'Invalid action provided' });
    }
  } catch (error) {
    console.error('[TrainingManagement] Exception:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
}
