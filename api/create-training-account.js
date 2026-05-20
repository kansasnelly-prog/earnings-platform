// Server-side API route for creating training accounts
// This uses the service role key to create auth users and database records

import { createClient } from '@supabase/supabase-js';
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

  try {
    const { email, password, name, referralCode } = req.body;

    // Validate required fields
    if (!email || !password || !name || !referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, name, and referral code are required'
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[CreateTrainingAccount] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({
        success: false,
        error: 'Server configuration missing'
      });
    }

    // Initialize Supabase client with service role key
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } catch (initError) {
      console.error('[CreateTrainingAccount] Failed to initialize Supabase client:', initError);
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize database connection'
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
    const authUserId = authData.user.id;

    // Generate new referral code for training account
    const newReferralCode = 'TRN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // STEP 3: Insert into public.users table for the training account
    console.log('[CreateTrainingAccount] STEP 3: Inserting into public.users for training account');
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
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
    console.log('[CreateTrainingAccount] STEP 4: Checking if training account exists for user:', authUserId);
    const { data: existingTrainingAccount, error: checkTrainingError } = await supabase
      .from('training_accounts')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    let trainingAccount;

    if (existingTrainingAccount && !checkTrainingError) {
      console.log('[CreateTrainingAccount] STEP 4: Training account already exists, reusing:', existingTrainingAccount);
      trainingAccount = existingTrainingAccount;
    } else {
      // Insert into training_accounts table with minimal fields - let database handle defaults
      console.log('[CreateTrainingAccount] STEP 4: Inserting into training_accounts');
      const { data: newTrainingAccount, error: trainingError } = await supabase
        .from('training_accounts')
        .insert({
          auth_user_id: authUserId,
          email: email.toLowerCase(),
          display_name: name,
          referral_code: newReferralCode,
          created_by: 'admin',
          assigned_to: 'admin',
          status: 'active'
          // Database defaults handle:
          // - amount: 1100.00 (balance)
          // - total_tasks: 45
          // - task_number: 1
          // - commission: 0
          // - progress: 0
          // - completed: false
          // - training_phase: 1
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

      console.log('[CreateTrainingAccount] STEP 4: Training account created:', newTrainingAccount);
      trainingAccount = newTrainingAccount;
    }

    // STEP 5: Create tasks for the new training account
    console.log('[CreateTrainingAccount] STEP 5: Creating tasks for training account');
    try {
      // Fetch training products from the training_products table
      const { data: trainingProducts, error: productsError } = await supabase
        .from('training_products')
        .select('product_number, price')
        .order('product_number', { ascending: true });

      if (productsError) {
        console.error('[CreateTrainingAccount] Failed to fetch training products:', productsError);
      } else if (trainingProducts && trainingProducts.length > 0) {
        console.log('[CreateTrainingAccount] Found', trainingProducts.length, 'training products');

        // Create task records for each product
        const tasksToInsert = trainingProducts.map(product => ({
          user_id: authUserId,
          task_number: product.product_number,
          status: 'locked',
          reward: product.price * 0.01, // 1% commission
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
      // Don't block account creation if task creation fails
    }

    console.log('[CreateTrainingAccount] COMPLETE - Training account creation finished successfully');

    // Send Telegram notification for new training account (don't block on failure)
    console.log('[Telegram] New account notification started');
    try {
      const message = `🎉 <b>New Account Created</b>\n\n` +
        `👤 <b>User Details:</b>\n` +
        `🆔 ID: <code>${authUserId}</code>\n` +
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

      // Call Supabase Edge Function instead of direct Telegram API
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
      // Don't block account creation if Telegram fails
    }

    return res.status(200).json({
      success: true,
      message: 'Training account created successfully',
      data: {
        userId: authUserId,
        email: email.toLowerCase(),
        trackingReferralCode: trackingReferralCode,
        linkedToUserId: existingUser.id
      }
    });

  } catch (error) {
    console.error('CREATE TRAINING ACCOUNT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.toString()
    });
  }
};
