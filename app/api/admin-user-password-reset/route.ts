import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    // Validate required fields
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields: email, newPassword' },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("CRITICAL: Supabase environment variables are missing in admin-user-password-reset.");
      return NextResponse.json(
        { error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }

    // Verify admin using logged-in user
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No auth token' },
        { status: 401 }
      );
    }

    // Get logged-in user from token
    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey!,
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
      return NextResponse.json(
        { error: 'Unauthorized user' },
        { status: 403 }
      );
    }

    // Verify admin email
    if (user.email !== "kansasnelly@gmail.com") {
      return NextResponse.json(
        { error: 'Not admin' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update password using Supabase Auth Admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      userData.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('[Admin Password Reset] Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log(`[Admin Password Reset] Password updated for user: ${userData.email} (${userData.display_name})`);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      userEmail: userData.email,
      displayName: userData.display_name
    });

  } catch (error: any) {
    console.error('[Admin Password Reset] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
