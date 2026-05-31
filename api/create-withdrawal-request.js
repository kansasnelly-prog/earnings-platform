// Server-side API route for creating withdrawal requests
// Secure backend function - requires user authentication

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, email, amount, walletAddress, walletType, currentBalance } = JSON.parse(event.body);

    // Validate required fields
    if (!userId || !email || !amount || !walletAddress || !walletType || currentBalance === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Validate amount
    if (amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Amount must be greater than 0' })
      };
    }

    if (amount > currentBalance) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` })
      };
    }

    // Import supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("CRITICAL: Supabase environment variables are missing in create-withdrawal-request.");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    // Verify user authentication
    const authHeader = event.headers.authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No auth token' })
      };
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the user making the request matches the userId
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

    const { data: { user }, error: userError } =
      await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !user) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized user' })
      };
    }

    // Ensure the authenticated user matches the userId in the request
    if (user.id !== userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'User ID mismatch' })
      };
    }

    console.log('[Withdrawal API] Creating withdrawal request:', { userId, email, amount, walletAddress, walletType, currentBalance });
    
    // Check if there's already a pending withdrawal for this user
    console.log('[Withdrawal API] Checking for existing pending withdrawals');
    const { data: existingPending, error: checkError } = await adminClient
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Withdrawal API] Error checking existing pending:', checkError);
    }
    
    if (existingPending) {
      console.error('[Withdrawal API] User already has pending withdrawal:', existingPending.id);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'You already have a pending withdrawal request. Please wait for admin approval.' })
      };
    }
    
    console.log('[Withdrawal API] No existing pending withdrawal, proceeding with insert');
    
    // Create the withdrawal request
    const withdrawalData = {
      user_id: userId,
      user_email: email,
      amount,
      wallet_address: walletAddress,
      wallet_type: walletType,
      status: 'pending',
      balance_snapshot: currentBalance,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('[Withdrawal API] Inserting withdrawal data:', withdrawalData);
    
    const { data, error } = await adminClient
      .from('withdrawals')
      .insert(withdrawalData)
      .select()
      .single();
    
    if (error) {
      console.error('[Withdrawal API] Error creating withdrawal:', error);
      console.error('[Withdrawal API] Error details:', { code: error.code, message: error.message, details: error.details });
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    console.log('[Withdrawal API] Withdrawal record created successfully:', data.id);
    
    // Create a transaction record for this withdrawal request
    console.log('[Withdrawal API] Creating transaction record');
    try {
      const transactionData = {
        user_id: userId,
        type: 'withdrawal_request',
        amount,
        description: `Withdrawal request of $${amount.toFixed(2)} to ${walletType} wallet`,
        status: 'pending',
        metadata: {
          withdrawal_id: data.id,
          wallet_address: walletAddress,
          wallet_type: walletType,
          balance_before: currentBalance
        },
        created_at: new Date().toISOString()
      };
      
      await adminClient.from('transactions').insert(transactionData);
      console.log('[Withdrawal API] Transaction record created successfully');
    } catch (transactionError) {
      console.error('[Withdrawal API] Error creating transaction record:', transactionError);
      // Don't fail the withdrawal if transaction creation fails
    }
    
    console.log('[Withdrawal API] Created successfully:', data.id);
    
    // Send Telegram notification
    try {
      // Import TelegramService dynamically to avoid import issues
      const { TelegramService } = require('../src/services/telegramService');
      await TelegramService.sendWithdrawalNotification(email, email, amount);
    } catch (telegramError) {
      console.error('[Withdrawal API] Telegram notification failed:', telegramError);
      // Don't fail the withdrawal if Telegram fails
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        withdrawalId: data.id
      })
    };

  } catch (error) {
    console.error('[Withdrawal API] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
