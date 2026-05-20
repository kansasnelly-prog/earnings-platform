// Server-side API route for admin password reset
// Secure backend function - requires admin authentication

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, newPassword } = JSON.parse(event.body);

    // Validate required fields
    if (!email || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: email, newPassword' })
      };
    }

    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Password must be at least 6 characters long' })
      };
    }

    // Import supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    // Verify admin using logged-in user
    const authHeader = event.headers.authorization;

    if (!authHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'No auth token' })
      };
    }

    // Get logged-in user from token
    const userClient = createClient(
      supabaseUrl,
      process.env.VITE_SUPABASE_ANON_KEY,
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

    // Verify admin email
    if (user.email !== "kansasnelly@gmail.com") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Not admin' })
      };
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Find user by email in the users table
    const { data: userData, error: fetchError } = await adminClient
      .from('users')
      .select('id, email, display_name')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !userData) {
      console.error('[Admin Password Reset] User not found:', email);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Update password using Supabase Auth Admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[Admin Password Reset] Error updating password:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update password: ' + updateError.message })
      };
    }

    console.log(`[Admin Password Reset] Password updated for user: ${userData.email} (${userData.display_name})`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Password updated successfully',
        userEmail: userData.email,
        displayName: userData.display_name
      })
    };

  } catch (error) {
    console.error('[Admin Password Reset] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
