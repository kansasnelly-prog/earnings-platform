// Server-side API route for repairing broken training account auth
// This fixes training accounts created before auth fix where database exists but auth user is missing

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
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[RepairTrainingAccount] Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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
      console.error('[RepairTrainingAccount] Failed to initialize Supabase client:', initError);
      return res.status(500).json({
        success: false,
        error: 'Failed to initialize database connection'
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

  } catch (error) {
    console.error('[RepairTrainingAccount] Exception:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}
