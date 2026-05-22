import { supabase } from '../lib/supabase';
import { TelegramService } from './telegramService';
import { toast } from '@/components/ui/use-toast';

// ===========================================
// TEMPORARY FIX FOR TEST ACCOUNT
// ===========================================
// This function fixes the doubled bonus amount for test account water@gmail.com
// TODO: Remove after fix is applied
export async function fixTestAccountBonus() {
  const email = 'water@gmail.com';
  const targetBonus = 1052.43;

  console.log(`[Fix Test Account Bonus] Starting fix for email: ${email}`);

  try {
    // Step 1: Find user by querying training_accounts table
    const { data: trainingAccount, error: accountError } = await supabase
      .from('training_accounts')
      .select('id, user_id')
      .eq('user_email', email)
      .single();

    if (accountError || !trainingAccount) {
      console.error('[Fix Test Account Bonus] Error fetching training account or not found:', accountError);
      return { success: false, error: 'Training account not found' };
    }

    console.log(`[Fix Test Account Bonus] Found training account:`, trainingAccount);
    const userId = trainingAccount.user_id || trainingAccount.id;

    // Step 2: Find existing phase 2 checkpoint for this user
    const { data: checkpoint, error: checkpointError } = await supabase
      .from('phase2_checkpoints')
      .select('*')
      .eq('auth_user_id', userId)
      .eq('status', 'approved')
      .single();

    if (checkpointError || !checkpoint) {
      console.error('[Fix Test Account Bonus] Error fetching checkpoint or no approved checkpoint found:', checkpointError);
      return { success: false, error: 'No approved checkpoint found' };
    }

    console.log(`[Fix Test Account Bonus] Found checkpoint:`, {
      id: checkpoint.id,
      current_bonus: checkpoint.bonus_amount,
      task_number: checkpoint.task_number,
      status: checkpoint.status
    });

    // Step 3: Update bonus_amount to correct value
    const { error: updateError } = await supabase
      .from('phase2_checkpoints')
      .update({ bonus_amount: targetBonus })
      .eq('id', checkpoint.id);

    if (updateError) {
      console.error('[Fix Test Account Bonus] Error updating bonus_amount:', updateError);
      return { success: false, error: 'Failed to update bonus_amount' };
    }

    console.log(`[Fix Test Account Bonus] SUCCESS: Updated bonus_amount from ${checkpoint.bonus_amount} to ${targetBonus}`);
    console.log(`[Fix Test Account Bonus] Checkpoint ID: ${checkpoint.id}`);
    console.log(`[Fix Test Account Bonus] User: ${email} (${userId})`);

    return { success: true, checkpointId: checkpoint.id, oldBonus: checkpoint.bonus_amount, newBonus: targetBonus };

  } catch (error: any) {
    console.error('[Fix Test Account Bonus] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================
// UPDATE FIRE USER FOR TESTING
// ===========================================
// This function resets fire@gmail.com to clean slate for testing varying commission logic
// TODO: Remove after testing is complete
export async function updateFireUserForTesting() {
  const email = 'fire@gmail.com';
  const targetBalance = 61.38;
  const targetTotalEarned = 10.25;
  const targetAccountType = 'personal';

  console.log(`[Update Fire User] Starting update for email: ${email}`);

  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        balance: targetBalance,
        total_earned: targetTotalEarned,
        account_type: targetAccountType
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('[Update Fire User] Error updating user:', error);
      return { success: false, error: error.message };
    }

    if (data && data.length > 0) {
      console.log(`[Update Fire User] SUCCESS: Updated user profile`);
      console.log(`[Update Fire User] Email: ${data[0].email}`);
      console.log(`[Update Fire User] Balance: ${data[0].balance}`);
      console.log(`[Update Fire User] Total Earned: ${data[0].total_earned}`);
      console.log(`[Update Fire User] Account Type: ${data[0].account_type}`);
      return { success: true, user: data[0] };
    } else {
      console.log(`[Update Fire User] No user found with email: ${email}`);
      return { success: false, error: 'User not found' };
    }
  } catch (error: any) {
    console.error('[Update Fire User] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================
// DATABASE TYPES
// ===========================================

export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string;
  phone?: string;
  balance: number;
  vip_level: number;
  total_earned: number;
  referral_code?: string;
  account_type: 'personal' | 'training' | 'admin';
  user_status: 'active' | 'suspended' | 'deleted';
  
  // Training
  training_completed: boolean;
  training_progress: number;
  training_phase: number;
  tasks_completed: number;
  total_tasks: number;
  task_number?: number;
  
  // Pending Order
  trigger_task_number: number | null;
  has_pending_order: boolean;
  pending_amount: number;
  is_negative_balance: boolean;
  profit_added: boolean;
  pending_product?: {
    name?: string;
    price1?: number;
    price2?: number;
    image1?: string;
    image2?: string;
  } | null;
  
  // Referral
  referred_by?: string | null;
  
  // Task Sets (VIP1)
  current_task_set: number;
  set_1_completed_at?: string | null;
  set_2_completed_at?: string | null;
  
  // Phase 2 tracking
  training_phase_2_checkpoint?: any;
  training_completed_v2?: boolean;
  commission_transferred?: boolean;
  commission_transfer_amount?: number;
  commission_transferred_at?: string | null;
  training_phase_1_locked?: boolean;
  training_phase_1_locked_at?: string | null;
  
  // VIP1 lock mechanism
  tasks_locked?: boolean;
  linked_training_account_id?: string | null;
  
  is_training_account: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface DatabaseTask {
  id: string;
  user_id: string;
  task_number: number;
  reward: number;
  commission_rate?: number;
  status: 'pending' | 'locked' | 'completed';
  product_name?: string;
  product_image?: string;
  product_price?: number;
  created_at: string;
  completed_at?: string;
}

export interface DatabaseTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'earning' | 'withdrawal' | 'task_reward' | 'combination_33' | 'profit_claim' | 'combination_order' | 'phase2_checkpoint_bonus' | 'phase2_checkpoint_approved' | 'training_completion_transfer_out' | 'training_completion_transfer_in';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  created_at: string;
}

// ===========================================
// PHASE 2 CHECKPOINT TYPES
// ===========================================

export interface Phase2Checkpoint {
  id: string;
  user_id: string;
  auth_user_id: string;
  email: string;
  phase: number;
  task_number: number;
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'completed' | 'submitted' | 'bonus_paid';
  product1_name: string;
  product1_image: string;
  product1_price: number;
  product2_name: string;
  product2_image: string;
  product2_price: number;
  combination_value: number;
  bonus_amount: number;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// PERSONAL DAY 2 CHECKPOINT TYPES
// ===========================================

export interface PersonalDay2Checkpoint {
  id: string;
  user_id: string;
  auth_user_id: string;
  email: string;
  cycle: number; // Day 2 = cycle 2
  task_number: number;
  status: 'pending' | 'pending_review' | 'approved' | 'rejected' | 'completed' | 'submitted' | 'bonus_paid';
  product1_name: string;
  product1_image: string;
  product1_price: number;
  product2_name: string;
  product2_image: string;
  product2_price: number;
  combination_value: number;
  bonus_amount: number;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTrainingAccount {
  id: string;
  user_id?: string;
  auth_user_id?: string;
  email: string;
  password: string;
  assigned_to?: string; 
  created_by?: string;
  status: string;
  progress: number;
  total_tasks: number;
  task_number?: number;
  amount?: number;
  product_name?: string;
  commission?: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseAdminLog {
  id: string;
  action: string;
  user_id?: string;
  admin_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

// ===========================================
// SUPABASE SERVICE
// ===========================================

export class SupabaseService {
  // Master referral codes that create VIP2 training accounts
  private static readonly MASTER_REFERRAL_CODES = ['OPT-MASTER', 'OPT-ADMIN', 'OPT-SYSTEM'];

  private static buildDefaultProfile(params: {
    id: string;
    email: string;
    displayName?: string | null;
    phone?: string | null;
    referralCode?: string | null;
  }) {
    // CORRECT: ALL new registrations create 'personal' account type with 35/35 task layout
    // Personal accounts: 35 tasks in Set 1, then 35 tasks in Set 2 after reset
    // Training accounts (separate): 45 tasks in Phase 1, then 45 tasks in Phase 2
    // Personal accounts are BLOCKED from tasks until training is completed
    // CRITICAL: Do NOT insert total_tasks into database - it doesn't exist in schema
    // Task count is calculated dynamically in AppContext.tsx based on account_type
    const account_type: 'training' | 'personal' = 'personal';
    
    // Only send essential fields - let database handle defaults for other fields
    return {
      id: params.id,
      email: params.email.trim().toLowerCase(),
      display_name: params.displayName || params.email.split('@')[0] || 'User',
      phone: params.phone || null,
      vip_level: 1,
      account_type: account_type,
      tasks_completed: 0,
      training_completed: false,
      referral_code: `OPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      referred_by: params.referralCode || null,
      tasks_locked: false,
    };
  }

  static async ensureUserProfile(params: {
    id: string;
    email?: string | null;
    displayName?: string | null;
    phone?: string | null;
    referralCode?: string | null;
  }): Promise<DatabaseUser | null> {
    try {
      console.log('[ensureUserProfile] Checking for existing profile:', params.id);
      
      // First attempt: Try to get existing user
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();

      if (existingError) {
        console.error('[ensureUserProfile] Error checking existing user profile:', existingError);
        // Don't return null yet, try to create the profile
      } else if (existingUser) {
        console.log('[ensureUserProfile] Found existing profile:', existingUser.id);
        return existingUser as DatabaseUser;
      }

      if (!params.email) {
        console.error('[ensureUserProfile] Cannot create profile without email');
        return null;
      }

      console.log('[ensureUserProfile] Creating new profile for:', params.id);
      
      const profilePayload = this.buildDefaultProfile({
        id: params.id,
        email: params.email,
        displayName: params.displayName,
        phone: params.phone,
        referralCode: params.referralCode,
      });

      // Try upsert (insert or update)
      const { data: createdUser, error: upsertError } = await supabase
        .from('users')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (upsertError) {
        console.error('[ensureUserProfile] Error creating user profile:', upsertError);
        
        // Try a second approach: direct insert if upsert failed
        console.log('[ensureUserProfile] Retrying with direct insert...');
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(profilePayload)
          .select()
          .maybeSingle();
        
        if (insertError) {
          console.error('[ensureUserProfile] Direct insert also failed:', insertError);
          return null;
        }
        
        console.log('[ensureUserProfile] Profile created via direct insert:', insertedUser?.id);
        return (insertedUser as DatabaseUser) || null;
      }

      console.log('[ensureUserProfile] Profile created via upsert:', createdUser?.id);
      return (createdUser as DatabaseUser) || null;
    } catch (error) {
      console.error('[ensureUserProfile] Exception ensuring user profile:', error);
      return null;
    }
  }

  // Ensure training account exists for new users
  // Called after user profile creation to set up the training flow
  static async ensureTrainingAccount(params: {
    authUserId: string;
    email: string;
    displayName?: string;
  }): Promise<boolean> {
    try {
      console.log('[ensureTrainingAccount] Setting up training account for:', params.authUserId);
      
      // Check if training account already exists
      const { data: existing, error: checkError } = await supabase
        .from('training_accounts')
        .select('*')
        .eq('auth_user_id', params.authUserId)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[ensureTrainingAccount] Error checking existing account:', checkError);
      }
      
      if (existing) {
        console.log('[ensureTrainingAccount] Training account already exists:', existing.id);
        return true;
      }
      
      // Create training account with minimal fields - let database handle defaults
      const trainingAccount = {
        auth_user_id: params.authUserId,
        email: params.email.toLowerCase().trim(),
        display_name: params.displayName || params.email.split('@')[0] || 'User',
        status: 'active'
        // Database defaults handle:
        // - amount: 1100.00 (balance)
        // - total_tasks: 45
        // - task_number: 1 (or 0 depending on schema)
        // - commission: 0
        // - progress: 0
        // - completed: false
        // - training_phase: 1
      };
      
      const { data: created, error: createError } = await supabase
        .from('training_accounts')
        .insert(trainingAccount)
        .select()
        .single();
      
      if (createError) {
        console.error('[ensureTrainingAccount] Error creating training account:', createError);
        return false;
      }
      
      console.log('[ensureTrainingAccount] Training account created successfully:', created?.id);
      console.log('[ensureTrainingAccount] Defaults set:', {
        task_number: 0,
        amount: 1100.00,
        training_phase: 1,
        total_tasks: 45
      });
      
      return true;
    } catch (error) {
      console.error('[ensureTrainingAccount] Exception:', error);
      return false;
    }
  }

  // ===========================================
  // USER OPERATIONS
  // ===========================================
  
  static async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return null;
      }
      
      return data as DatabaseUser;
    } catch (error: any) {
      console.error('Exception creating user:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
  }
  
  static async getUserById(userId: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }

      if (data) {
        let userData = data as DatabaseUser;
        // Apply training account override if exists
        userData = await this.applyTrainingAccountOverride(userData, userId);
        return userData;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.id === userId) {
        let userData = await this.ensureUserProfile({
          id: authUser.id,
          email: authUser.email,
          displayName: (authUser.user_metadata?.display_name as string | undefined) || null,
          phone: (authUser.user_metadata?.phone as string | undefined) || null,
        });
        // Apply training account override if exists
        if (userData) {
          userData = await this.applyTrainingAccountOverride(userData, userId);
        }
        return userData;
      }

      return null;
    } catch (error) {
      console.error('Exception fetching user:', error);
      return null;
    }
  }
  
  static async getUserByEmail(email: string): Promise<DatabaseUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user by email:', error);
        return null;
      }
      
      return data as DatabaseUser | null;
    } catch (error) {
      console.error('Exception fetching user by email:', error);
      return null;
    }
  }
  
  static async updateUser(userId: string, updates: Partial<DatabaseUser>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user:', error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Exception updating user:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
  }
  
  // ===========================================
  // AUTH OPERATIONS
  // ===========================================
  
  static async signUp(email: string, password: string, displayName: string, phone?: string, referralCode?: string | null): Promise<{ user: DatabaseUser | null; error: string | null }> {
    const emailLower = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailLower,
        password,
        options: {
          data: {
            display_name: displayName,
            phone: phone || null,
            referral_code: referralCode || null,
          },
        },
      });

      if (error) {
        const signupMessage = error.message || '';
        const alreadyRegistered = /already registered|already exists|user already/i.test(signupMessage);
        if (alreadyRegistered) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: emailLower,
            password,
          });

          if (signInError || !signInData.user) {
            return { user: null, error: signInError?.message || 'User already registered. Please log in.' };
          }

          const recoveredUser = await this.ensureUserProfile({
            id: signInData.user.id,
            email: signInData.user.email || emailLower,
            displayName: (signInData.user.user_metadata?.display_name as string | undefined) || displayName || null,
            phone: (signInData.user.user_metadata?.phone as string | undefined) || phone || null,
            referralCode: (signInData.user.user_metadata?.referral_code as string | undefined) || referralCode || null,
          });

          if (!recoveredUser) {
            return { user: null, error: 'User exists in auth, but profile recovery failed.' };
          }

          return { user: recoveredUser, error: null };
        }

        console.error('Signup error:', signupMessage);
        return { user: null, error: signupMessage };
      }

      if (!data?.user) {
        return { user: null, error: 'Could not create account. Try again or use a different email.' };
      }

      const authUserId = data.user.id;
      let session = data.session;

      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: emailLower,
          password,
        });

        if (signInError) {
          const msg = signInError.message || '';
          if (/confirm|verify|not confirmed|email.*not.*confirmed/i.test(msg)) {
            return {
              user: null,
              error: 'Account created. Confirm the link sent to your email, then sign in.',
            };
          }
          console.error('Sign in after signup failed:', signInError);
          return { user: null, error: signInError.message };
        }

        session = signInData.session;
      }

      if (!session) {
        return {
          user: null,
          error:
            'Account created but you are not signed in yet. If email confirmation is enabled in Supabase, open the confirmation link first, then sign in.',
        };
      }

      const userData = await this.ensureUserProfile({
        id: authUserId,
        email: emailLower,
        displayName,
        phone: phone || null,
        referralCode: referralCode || null,
      });

      if (!userData) {
        return { user: null, error: 'Failed to create or fetch public.users profile after signup.' };
      }

      // Create training account for the fixed training flow (only for VIP2 training accounts)
      const trainingAccountCreated = userData.account_type === 'training' 
        ? await this.ensureTrainingAccount({
            authUserId,
            email: emailLower,
            displayName
          })
        : null;
      
      if (userData.account_type === 'training' && !trainingAccountCreated) {
        console.error('[signUp] Failed to create training account for:', authUserId);
        // Don't block signup if training account fails - will be created on first login
      }

      // Link VIP1 personal accounts to VIP2 training accounts if a referral code was provided
      if (userData.account_type === 'personal' && userData.vip_level === 1 && referralCode) {
        try {
          // Find the VIP2 training account that used this personal account's referral code
          // The personal account's referral_code is generated during profile creation
          // We need to find a training account that has this personal account's referral_code as its referred_by
          const { data: trainingAccount, error: trainingError } = await supabase
            .from('users')
            .select('id')
            .eq('referred_by', userData.referral_code)
            .eq('account_type', 'training')
            .eq('vip_level', 2)
            .single();

          if (!trainingError && trainingAccount) {
            // Link the VIP1 account to the VIP2 training account
            await supabase
              .from('users')
              .update({
                linked_training_account_id: trainingAccount.id,
                updated_at: new Date().toISOString()
              })
              .eq('id', userData.id);

            console.log('[signUp] Linked VIP1 account to VIP2 training account:', trainingAccount.id);
          }
        } catch (linkError) {
          console.error('[signUp] Error linking VIP1 to training account:', linkError);
          // Don't block signup if linking fails
        }
      }

      // TRAINING COMPLETION GATE: Only create tasks for training accounts or personal accounts with completed training
      // Personal accounts are BLOCKED from task generation until training is completed
      if (userData.account_type === 'personal' && !userData.training_completed) {
        console.log('[signUp] SAFE GATE: Personal account blocked - training not completed, skipping task creation');
        console.log('[signUp] SAFE GATE: No tasks will be generated until training is verified as complete');
      } else {
        // Determine task count based on account_type
        // Training accounts: 45 tasks per phase (Phase 1: 45, Phase 2: 45)
        // Personal accounts: 35 tasks per set (Set 1: 35, Set 2: 35) - only if training completed
        const taskCount = userData.account_type === 'training' ? 45 : 35;
        const tasksCreated = await this.createTrainingTasks(authUserId, taskCount);
        if (!tasksCreated) {
          console.error('Failed to create training tasks');
        }
      }

      // Send detailed Telegram notification for new account (don't block on failure)
      console.log('[Telegram] New account notification started');
      TelegramService.sendNewAccountNotification({
        userId: userData.id,
        email: userData.email,
        displayName: userData.display_name,
        accountType: userData.account_type as 'personal' | 'training' | 'admin',
        vipLevel: userData.vip_level,
        balance: userData.balance,
        referralCode: userData.referral_code,
        userStatus: userData.user_status,
        createdAt: userData.created_at,
        isTrainingAccount: userData.account_type === 'training',
        trainingBalance: userData.balance,
        taskNumber: userData.tasks_completed || 0,
        totalTasks: taskCount
      }).then(sent => {
        if (sent) {
          console.log('[Telegram] New account notification sent');
        } else {
          console.error('[Telegram] New account notification failed');
        }
      }).catch(err => {
        console.error('[Telegram] New account notification failed:', err);
      });

      return { user: userData as DatabaseUser, error: null };
    } catch (error: unknown) {
      console.error('Signup exception:', error);
      const message = error instanceof Error ? error.message : 'Signup failed';
      let classifiedError = message;
      if (message.includes('fetch') || message.includes('NetworkError')) {
        classifiedError =
          'Network error: cannot reach Supabase. Check VITE_SUPABASE_URL, project status, and browser extensions blocking requests.';
      }
      if (message.includes('timeout')) {
        classifiedError = 'Connection timed out. The Supabase project may be paused or unreachable.';
      }
      return { user: null, error: classifiedError };
    }
  }
  
  static async signIn(email: string, password: string): Promise<{ user: DatabaseUser | null; error: string | null }> {
    const emailLower = email.trim().toLowerCase();
    console.log('[SupabaseService.signIn] Login attempt for:', emailLower);
    console.log('[SupabaseService.signIn] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password,
      });

      console.log('[SupabaseService.signIn] Auth response:', { 
        hasUser: !!authData.user, 
        hasSession: !!authData.session,
        error: authError?.message 
      });

      if (authError) {
        console.error('[SupabaseService.signIn] Auth signin error:', authError);
        return { user: null, error: authError.message };
      }

      if (!authData.user) {
        console.error('[SupabaseService.signIn] No user returned from auth');
        return { user: null, error: 'Failed to sign in - no user returned' };
      }

      console.log('[SupabaseService.signIn] User authenticated, fetching profile for ID:', authData.user.id);
      
      const userData = await this.ensureUserProfile({
        id: authData.user.id,
        email: authData.user.email,
        displayName: (authData.user.user_metadata?.display_name as string | undefined) || null,
        phone: (authData.user.user_metadata?.phone as string | undefined) || null,
      });

      if (!userData) {
        console.error('[SupabaseService.signIn] Failed to ensure user profile');
        return {
          user: null,
          error: 'No public.users profile for this account (sign-up insert or RLS may have failed).',
        };
      }

      console.log('[SupabaseService.signIn] Login successful for:', emailLower);
      
      // Send Telegram notification for login
      TelegramService.sendLoginNotification(emailLower, userData.display_name).catch(err => {
        console.error('[SupabaseService] Failed to send login notification:', err);
      });
      
      return { user: userData as DatabaseUser, error: null };
    } catch (error: unknown) {
      console.error('[SupabaseService.signIn] Exception in signIn:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';
      return { user: null, error: message };
    }
  }
  
  static async signOut(): Promise<boolean> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Exception in signOut:', error);
      return false;
    }
  }
  
  static async getCurrentUser(): Promise<DatabaseUser | null> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        return null;
      }

      let userData = await this.ensureUserProfile({
        id: authUser.id,
        email: authUser.email,
        displayName: (authUser.user_metadata?.display_name as string | undefined) || null,
        phone: (authUser.user_metadata?.phone as string | undefined) || null,
      });

      // Check for training account and override balance/task_number
      if (userData) {
        userData = await this.applyTrainingAccountOverride(userData, authUser.id);
      }

      return userData;
    } catch (error) {
      console.error('Exception in getCurrentUser:', error);
      return null;
    }
  }

  private static async applyTrainingAccountOverride(userData: any, authUserId: string): Promise<any> {
    if (!userData) return null;

    // Only apply training account override if the user is actually a training account
    // Personal accounts should never have their balance overridden with training account data
    if (userData.account_type !== 'training') {
      console.log('[applyTrainingAccountOverride] Skipping override - user is not a training account:', userData.account_type);
      return userData;
    }

    try {
      const { data: trainingAccount } = await supabase
        .from('training_accounts')
        .select('task_number, total_tasks')
        .eq('auth_user_id', authUserId)
        .maybeSingle();

      if (trainingAccount) {
        console.log('[applyTrainingAccountOverride] Found training account, overriding tasks only (not balance)');
        return {
          ...userData,
          // Keep balance from users table - do NOT override with training_accounts.amount
          tasks_completed: trainingAccount.task_number || 0,
          total_tasks: trainingAccount.total_tasks || 45,
          account_type: 'training',
        };
      }

      return userData;
    } catch (error) {
      console.error('[applyTrainingAccountOverride] Error:', error);
      return userData;
    }
  }
  
  // ===========================================
  // VIP COMMISSION RATES
  // ===========================================
  
  static getVIPCommissionRate(vipLevel: number, isTraining: boolean = false): number {
    // Training accounts get 1% commission rate (same as VIP2)
    if (isTraining) {
      return 0.01; // 1% for training accounts
    }
    // VIP commission rates - Set A (Balanced)
    // VIP1 Bronze: 0.5% - $0-$100
    // VIP2 Silver: 1.0% - $101-$500
    // VIP3 Gold: 3.0% - $501+
    const rates: Record<number, number> = {
      1: 0.005,  // VIP1 Bronze = 0.5%
      2: 0.01,   // VIP2 Silver = 1.0%
      3: 0.03,   // VIP3 Gold = 3.0%
    };
    return rates[vipLevel] || 0.005; // Default to VIP1 Bronze rate
  }

  static getVIPTierName(vipLevel: number): string {
    const names: Record<number, string> = {
      1: 'Bronze',
      2: 'Silver',
      3: 'Gold',
    };
    return names[vipLevel] || 'Bronze';
  }

  static getVIPBalanceRange(vipLevel: number): string {
    const ranges: Record<number, string> = {
      1: '$0 - $100',
      2: '$101 - $500',
      3: '$501+',
    };
    return ranges[vipLevel] || '$0 - $100';
  }
  
  // Predefined reward arrays for VIP1 personal accounts
  // Cycle 1: 35 tasks summing to $10.25
  private static VIP1_CYCLE_1_REWARDS = [
    0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21,
    0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30, 0.31,
    0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.40, 0.41,
    0.42, 0.43, 0.44, 0.45, 0.56
  ];
  
  // Cycle 2: 35 tasks summing to $10.25
  private static VIP1_CYCLE_2_REWARDS = [
    0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.20, 0.21,
    0.22, 0.23, 0.24, 0.25, 0.26, 0.27, 0.28, 0.29, 0.30, 0.31,
    0.32, 0.33, 0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.40, 0.41,
    0.42, 0.43, 0.44, 0.45, 0.56
  ];

  static calculateTaskReward(productPrice: number, vipLevel: number, isTraining: boolean = false): number {
    const commissionRate = this.getVIPCommissionRate(vipLevel, isTraining);
    const reward = productPrice * commissionRate;
    return Math.round(reward * 100) / 100; // Round to 2 decimal places
  }
  
  // ===========================================
  // TASK OPERATIONS
  // ===========================================
  
  // ===========================================
  // VIP1 PERSONAL TASK REWARD UPDATE
  // ===========================================
  
  static async updateVIP1PersonalTaskRewards(userId: string): Promise<boolean> {
    try {
      console.log('[updateVIP1PersonalTaskRewards] Calling RPC to update rewards for user:', userId);
      
      const { data, error } = await supabase.rpc('update_vip1_personal_rewards');
      
      if (error) {
        console.error('[updateVIP1PersonalTaskRewards] RPC error:', error);
        return false;
      }
      
      console.log('[updateVIP1PersonalTaskRewards] RPC success:', data);
      return true;
    } catch (error: any) {
      console.error('[updateVIP1PersonalTaskRewards] Exception:', error);
      return false;
    }
  }

  static async createTrainingTasks(userId: string, taskCount: number = 35): Promise<boolean> {
    try {
      // Get user's account_type to determine task count
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('vip_level, account_type, personal_cycle, training_phase')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user for account_type:', userError);
        return false;
      }

      const accountType = user?.account_type || 'training';
      const vipLevel = user?.vip_level || 1;
      const trainingPhase = user?.training_phase || 1;
      const isTraining = accountType === 'training';
      const isPersonal = accountType === 'personal';
      const personalCycle = user?.personal_cycle || 1;
      const isVIP1Personal = isPersonal && vipLevel === 1;

      // CRITICAL: Determine task count based on account_type, NOT VIP level
      // Training accounts: 45 tasks per phase (Phase 1: 45, Phase 2: 45)
      // Personal accounts: 35 tasks per set (Set 1: 35, Set 2: 35)
      const actualTaskCount = isTraining ? 45 : (isPersonal ? 35 : 45);
      console.log(`[createTrainingTasks] Creating ${actualTaskCount} tasks for ${accountType} account (user: ${userId})`);

      // Define commission rate for logging (outside task loop scope)
      const commissionRate = isPersonal ? 0.005 : this.getVIPCommissionRate(vipLevel, isTraining);

      // Fetch training products from database
      const { data: trainingProducts, error: productsError } = await supabase
        .from('training_products')
        .select('*')
        .order('product_number', { ascending: true })
        .limit(actualTaskCount);

      if (productsError) {
        console.error('Error fetching training products:', productsError);
      }

      // Create training tasks using actual product data or fallback to placeholders
      // For VIP1 Personal accounts, we need to calculate commissions in two passes
      // to ensure the total exactly equals $10.25
      const tasks = Array.from({ length: actualTaskCount }, (_, i) => {
        let productName = `Training Product ${i + 1}`;
        let productPrice = Math.floor(Math.random() * 100) + 50;
        let productImage = null;

        // Use actual product data if available
        if (trainingProducts && trainingProducts[i]) {
          productName = trainingProducts[i].product_name || productName;
          productPrice = trainingProducts[i].price || productPrice;
          productImage = trainingProducts[i].image || null;
        }

        // VIP1 Personal accounts use deterministic variance for natural fluctuation
        // with strict cap to ensure exactly $10.25 total for 35 tasks
        let reward;
        let commissionRate = isPersonal ? 0.005 : this.getVIPCommissionRate(vipLevel, isTraining);
        
        if (isVIP1Personal) {
          // Dynamic commission rate for personal accounts to ensure exactly $10.25 for 35 tasks
          // Uses deterministic pseudorandom variance based on task number to look natural
          const TARGET_TOTAL = 10.25;
          const TOTAL_TASKS = 35;
          const MIN_COMMISSION = 0.15;
          const MAX_COMMISSION = 0.42;
          
          // Deterministic pseudorandom function based on task number
          const deterministicRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
          };
          
          // Calculate commission for this task
          if (i + 1 <= 32) {
            // Tasks 1-32: Generate varied commission between $0.15 and $0.42
            const randomValue = deterministicRandom(i + 1);
            reward = MIN_COMMISSION + (randomValue * (MAX_COMMISSION - MIN_COMMISSION));
          } else {
            // Tasks 33-35: Will be calculated after generating all 35 tasks
            // For now, use placeholder (will be adjusted below)
            reward = TARGET_TOTAL / TOTAL_TASKS;
          }
          
          commissionRate = 0.005; // 0.5% for VIP1 personal
        } else {
          // Calculate reward based on product price and VIP commission rate
          reward = this.calculateTaskReward(productPrice, vipLevel);

          // Add small variation for realism (±10%)
          const variation = (Math.random() - 0.5) * 0.2;
          reward = reward * (1 + variation);
          reward = Math.max(0.25, reward); // Minimum $0.25 per task
        }

        return {
          user_id: userId,
          task_number: i + 1,
          reward: Math.round(reward * 100) / 100,
          commission_rate: commissionRate,
          status: i === 0 ? 'pending' : 'locked',
          product_name: productName,
          product_price: productPrice,
          product_image: productImage
        };
      });

      // For VIP1 Personal accounts, adjust final 3 tasks to ensure total exactly equals $10.25
      if (isVIP1Personal && actualTaskCount === 35) {
        const TARGET_TOTAL = 10.25;
        
        // Calculate total of first 32 tasks
        const first32Total = tasks.slice(0, 32).reduce((sum, task) => sum + task.reward, 0);
        
        // Calculate remaining amount needed for tasks 33-35
        const remainingAmount = TARGET_TOTAL - first32Total;
        
        // Distribute remaining amount across tasks 33, 34, 35
        // Use deterministic distribution for consistency
        const task33Share = remainingAmount * 0.35; // 35% of remaining
        const task34Share = remainingAmount * 0.33; // 33% of remaining
        const task35Share = remainingAmount * 0.32; // 32% of remaining
        
        // Update the final 3 tasks
        tasks[32].reward = Math.round(task33Share * 100) / 100;
        tasks[33].reward = Math.round(task34Share * 100) / 100;
        tasks[34].reward = Math.round(task35Share * 100) / 100;
        
        // Verify total equals exactly $10.25 (accounting for rounding)
        const finalTotal = tasks.reduce((sum, task) => sum + task.reward, 0);
        const roundingError = TARGET_TOTAL - finalTotal;
        
        // If there's a rounding error, add it to the last task
        if (Math.abs(roundingError) > 0.001) {
          tasks[34].reward = Math.round((tasks[34].reward + roundingError) * 100) / 100;
        }
        
        console.log(`[SupabaseService] VIP1 Personal commission distribution: First 32 tasks = $${first32Total.toFixed(2)}, Final 3 tasks = $${(tasks[32].reward + tasks[33].reward + tasks[34].reward).toFixed(2)}, Total = $${tasks.reduce((sum, task) => sum + task.reward, 0).toFixed(2)}`);
      }

      const { error } = await supabase.from('tasks').insert(tasks);

      if (error) {
        console.error('Error creating training tasks:', error);
        return false;
      }

      console.log(`[SupabaseService] Created ${actualTaskCount} training tasks for user ${userId} with ${isTraining ? 'Training' : 'VIP' + vipLevel} rate (${commissionRate * 100}%)`);
      return true;
    } catch (error) {
      console.error('Exception creating training tasks:', error);
      return false;
    }
  }
  
  static async getUserTasks(userId: string): Promise<DatabaseTask[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('task_number', { ascending: true });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      
      return data as DatabaseTask[];
    } catch (error) {
      console.error('Exception fetching tasks:', error);
      return [];
    }
  }
  
  static async completeTask(userId: string, taskNumber: number): Promise<{ success: boolean; reward?: number; error?: string; autoReset?: boolean; phase1Locked?: boolean; phase2Checkpoint?: boolean }> {
    try {
      // Get user info to check training completion status
      const { data: userCheck, error: trainingCheckError } = await supabase
        .from('users')
        .select('account_type, training_completed')
        .eq('id', userId)
        .single();

      if (trainingCheckError || !userCheck) {
        return { success: false, error: 'User not found' };
      }

      // CRITICAL: Personal accounts must complete training before submitting tasks
      if (userCheck.account_type === 'personal' && !userCheck.training_completed) {
        console.error('[completeTask] Training completion check failed for personal account:', userId);
        return { success: false, error: 'Training must be completed before submitting tasks' };
      }

      // Get task info
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_number', taskNumber)
        .single();

      if (taskError || !task) {
        return { success: false, error: 'Task not found' };
      }

      if (task.status === 'completed') {
        return { success: false, error: 'Task already completed' };
      }

      const reward = task.reward;

      console.log('[completeTask] Task details:', { taskNumber, taskId: task.id, reward, task });

      // Update task status - do NOT include completed_at as it doesn't exist in database schema
      const updatePayload = { status: 'completed' };
      console.log('[TASK PATCH PAYLOAD]', updatePayload);
      
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', task.id);

      if (updateError) {
        console.error('[completeTask] Task update error:', updateError);
        return { success: false, error: updateError.message };
      }

      // Update user balance and stats
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      const newTasksCompleted = user.tasks_completed + 1;
      const isVIP2 = user.vip_level === 2 && user.account_type === 'training';
      const isPhase1 = user.training_phase === 1;
      const isPhase2 = user.training_phase === 2;
      const isTrainingAccount = user.account_type === 'training';

      // Calculate training progress based on VIP level
      const totalTasks = isVIP2 ? 45 : 35;
      const trainingProgress = Math.min(100, Math.round((newTasksCompleted / totalTasks) * 100));

      // For training accounts, update training_accounts table instead of users table
      if (isTrainingAccount) {
        console.log('[completeTask] Updating training_accounts for training account');

        // Get current training account data
        const { data: trainingAccount, error: trainingFetchError } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', userId)
          .single();

        if (trainingFetchError || !trainingAccount) {
          console.error('[completeTask] Failed to fetch training account:', trainingFetchError);
          return { success: false, error: 'Training account not found' };
        }

        // Update training_accounts with new values
        const { error: trainingUpdateError } = await supabase
          .from('training_accounts')
          .update({
            amount: trainingAccount.amount + reward,
            task_number: taskNumber + 1,
            commission: trainingAccount.commission + reward
          })
          .eq('auth_user_id', userId);

        if (trainingUpdateError) {
          console.error('[completeTask] Failed to update training_accounts:', trainingUpdateError);
          return { success: false, error: trainingUpdateError.message };
        }

        // Also update users table - including balance to keep in sync with training_accounts + initial capital
        const INITIAL_TRAINING_BALANCE = 1100;
        const newBalance = INITIAL_TRAINING_BALANCE + trainingAccount.amount + reward; // Full balance = initial + earned
        const newEarnedRewards = trainingAccount.amount + reward; // Only earned rewards
        const { error: userStatsError } = await supabase
          .from('users')
          .update({
            balance: newBalance, // Full training balance = initial capital + earned rewards
            total_earned: newEarnedRewards, // Only earned rewards (not including initial capital)
            tasks_completed: newTasksCompleted,
            training_progress: trainingProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (userStatsError) {
          console.error('[completeTask] Failed to update user stats:', userStatsError);
        }
      } else {
        // For personal/admin accounts, update users table as before
        const isVIP1Personal = user.vip_level === 1 && user.account_type === 'personal';
        const personalCycle = user.personal_cycle || 1;
        const personalCycleCompleted = user.personal_cycle_completed || false;
        
        // Cap earnings at $71.63 for VIP1 personal accounts
        let newBalance = user.balance + reward;
        let newTotalEarned = user.total_earned + reward;
        if (isVIP1Personal && newTotalEarned > 71.63) {
          newTotalEarned = 71.63;
          // Don't cap newBalance - let it compound dynamically onto current balance
          console.log('[completeTask] Capping VIP1 personal total_earned at $71.63, but balance continues to compound:', newBalance);
        }
        
        const updateData: any = {
          balance: newBalance,
          total_earned: newTotalEarned,
          tasks_completed: newTasksCompleted,
          training_progress: trainingProgress,
          updated_at: new Date().toISOString()
        };
        
        // Only include personal_cycle fields if they exist in the user record
        if (user.personal_cycle !== undefined) {
          updateData.personal_cycle = personalCycle;
        }
        if (user.personal_cycle_completed !== undefined) {
          updateData.personal_cycle_completed = personalCycleCompleted;
        }
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        if (userUpdateError) {
          console.error('[completeTask] Failed to update user stats:', userUpdateError);
          return { success: false, error: userUpdateError.message };
        }

        // Check if VIP1 personal account completed a cycle (35 tasks)
        if (isVIP1Personal && newTasksCompleted >= 35 && !personalCycleCompleted) {
          console.log('[completeTask] VIP1 personal account completed cycle', personalCycle, '(35/35 tasks)');
          
          // Mark current cycle as completed
          await supabase
            .from('users')
            .update({ personal_cycle_completed: true })
            .eq('id', userId);
            
          console.log('[completeTask] Set personal_cycle_completed to true for cycle', personalCycle);
        }
        
        // Check for Personal Day 2 checkpoint at task #21 (cycle 2)
        let personalDay2Checkpoint = false;
        if (isVIP1Personal && personalCycle === 2 && newTasksCompleted >= 21) {
          // Check if checkpoint already exists
          const existingCheckpoint = await this.getUserPendingPersonalDay2Checkpoint(userId);
          if (!existingCheckpoint) {
            console.log('[completeTask] Personal Day 2 checkpoint triggered at task #21 for personal account');
            
            // Get products for the checkpoint
            const ProductCatalogService = (await import('@/services/productCatalogService')).default;
            const product1 = ProductCatalogService.getProductForTask(21, 'personal');
            const product2 = ProductCatalogService.getProductForTask(22, 'personal');
            
            // Create checkpoint
            await this.createPersonalDay2Checkpoint(
              userId,
              user.email,
              21,
              {
                name: product1.name,
                image: product1.image,
                price: product1.price
              },
              {
                name: product2.name,
                image: product2.image,
                price: product2.price
              },
              186.00 // 6X bonus
            );
            
            personalDay2Checkpoint = true;
          }
        }
      }

      // Create transaction record
      await this.createTransaction({
        user_id: userId,
        type: 'task_reward',
        amount: reward,
        description: `Completed task ${taskNumber}`,
        status: 'completed'
      });

      // Unlock next task
      await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('user_id', userId)
        .eq('task_number', taskNumber + 1);

      // Check Phase 1 lock for VIP2 (45 tasks)
      let phase1Locked = false;
      if (isVIP2 && isPhase1 && newTasksCompleted >= 45) {
        console.log('[completeTask] Phase 1 completed (45/45) for VIP2, locking account');
        // Lock Phase 1 - database trigger will handle this
        phase1Locked = true;
      }

      // Check Phase 2 checkpoint at task #30 for VIP2
      let phase2Checkpoint = false;
      if (isVIP2 && isPhase2 && newTasksCompleted >= 30 && user.training_phase_2_checkpoint?.status !== 'pending_review') {
        console.log('[completeTask] Phase 2 checkpoint triggered at task #30 for VIP2');
        // Database trigger will handle this
        phase2Checkpoint = true;
      }

      // Check Phase 2 completion (45 tasks) for VIP2
      if (isVIP2 && isPhase2 && newTasksCompleted >= 45) {
        console.log('[completeTask] Phase 2 completed (45/45) for VIP2, marking training_completed_v2');
        await supabase
          .from('users')
          .update({ training_completed_v2: true })
          .eq('id', userId);
      }

      // Check if user completed Set 1 (35 tasks) and needs auto-reset to Set 2 (VIP1 only)
      let autoResetTriggered = false;
      if (!isVIP2 && user.current_task_set === 1 && newTasksCompleted >= 35) {
        console.log('[completeTask] Set 1 completed (35/35), triggering auto-reset to Set 2');
        
        // Call the auto-reset function
        const { data: resetData, error: resetError } = await supabase.rpc('auto_reset_to_set_2', { p_user_id: userId });
        
        if (resetError) {
          console.error('[completeTask] Auto-reset to Set 2 failed:', resetError);
        } else {
          console.log('[completeTask] Auto-reset to Set 2 successful:', resetData);
          autoResetTriggered = true;
          
          // Create 35 new tasks for Set 2
          await this.createTrainingTasks(userId, 35);
        }
      }

      return { success: true, reward, autoReset: autoResetTriggered, phase1Locked, phase2Checkpoint };
    } catch (error: any) {
      console.error('Exception completing task:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // PENDING ORDER OPERATIONS
  // ===========================================
  
  static async createPendingOrder(userId: string, taskNumber: number, amount: number, product: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          has_pending_order: true,
          trigger_task_number: taskNumber,
          pending_amount: amount,
          is_negative_balance: true,
          pending_product: product,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        console.error('Error creating pending order:', error);
        return false;
      }
      
      // Create transaction for combination order
      await this.createTransaction({
        user_id: userId,
        type: 'combination_order',
        amount: amount,
        description: `Combination order at task ${taskNumber}`,
        status: 'completed',
        metadata: { product }
      });
      
      return true;
    } catch (error) {
      console.error('Exception creating pending order:', error);
      return false;
    }
  }
  
  static async clearPendingOrderAndAddProfit(userId: string): Promise<{ success: boolean; profit?: number; error?: string }> {
    try {
      // Get user current pending order info
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }
      
      if (!user.has_pending_order) {
        return { success: false, error: 'No pending order to clear' };
      }
      
      const pendingAmount = user.pending_amount;
      const profit = pendingAmount * 6; // 6x profit
      
      // Clear pending order and add profit
      const { error: updateError } = await supabase
        .from('users')
        .update({
          has_pending_order: false,
          is_negative_balance: false,
          profit_added: true,
          balance: user.balance + pendingAmount + profit,
          pending_amount: 0,
          pending_product: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Create profit transaction
      await this.createTransaction({
        user_id: userId,
        type: 'profit_claim',
        amount: profit,
        description: `6x Profit claimed (${pendingAmount} x 6)`,
        status: 'completed'
      });
      
      return { success: true, profit };
    } catch (error: any) {
      console.error('Exception clearing pending order:', error);
      return { success: false, error: error.message };
    }
  }

  // ===========================================
  // TRAINING COMPLETION & BALANCE TRANSFER
  // ===========================================

  static async completeTrainingAndTransferBalance(trainingUserId: string): Promise<{ success: boolean; transferredAmount?: number; error?: string }> {
    try {
      console.log(`[SupabaseService] Completing training for user ${trainingUserId}`);
      
      // Get training account details
      const { data: trainingUser, error: trainingError } = await supabase
        .from('users')
        .select('*')
        .eq('id', trainingUserId)
        .single();
      
      if (trainingError || !trainingUser) {
        console.error('[SupabaseService] Training user not found:', trainingError);
        return { success: false, error: 'Training account not found' };
      }

      // Verify this is a training account
      if (trainingUser.account_type !== 'training') {
        return { success: false, error: 'This is not a training account' };
      }

      // Check if training is already completed
      if (trainingUser.training_completed) {
        return { success: false, error: 'Training is already marked as completed' };
      }

      // Get the linked personal account using referred_by (which stores the personal account's referral code)
      const personalReferralCode = trainingUser.referred_by;
      if (!personalReferralCode) {
        return { success: false, error: 'No linked personal account found (referred_by is empty)' };
      }

      const { data: personalUser, error: personalError } = await supabase
        .from('users')
        .select('*')
        .eq('referral_code', personalReferralCode)
        .eq('account_type', 'personal')
        .single();
      
      if (personalError || !personalUser) {
        console.error('[SupabaseService] Personal account not found:', personalError);
        return { success: false, error: 'Linked personal account not found' };
      }

      const trainingBalance = trainingUser.balance || 0;
      const currentPersonalBalance = personalUser.balance || 0;

      if (trainingBalance <= 0) {
        return { success: false, error: 'No balance to transfer from training account' };
      }

      // Calculate 2% of training balance for transfer
      const transferAmount = Math.round(trainingBalance * 0.02 * 100) / 100; // Round to 2 decimal places

      console.log(`[SupabaseService] Transferring 2% ($${transferAmount}) of $${trainingBalance} from training to personal account ${personalUser.id}`);

      // Update training account - mark as completed and subtract commission from balance
      const { error: updateTrainingError } = await supabase
        .from('users')
        .update({
          training_completed: true,
          balance: trainingBalance - transferAmount, // Subtract commission from training account
          total_earned: trainingUser.total_earned || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingUserId);

      if (updateTrainingError) {
        console.error('[SupabaseService] Error updating training account:', updateTrainingError);
        return { success: false, error: 'Failed to update training account: ' + updateTrainingError.message };
      }

      // Update personal account - ADD commission to existing balance (preserve existing balance)
      // CRITICAL FIX: Personal account should keep existing balance and add 2% commission
      const newPersonalBalance = currentPersonalBalance + transferAmount;
      const newPersonalTotalEarned = (personalUser.total_earned || 0) + transferAmount;
      
      const { error: updatePersonalError } = await supabase
        .from('users')
        .update({
          balance: newPersonalBalance, // ADD commission to existing balance
          total_earned: newPersonalTotalEarned, // ADD commission to existing total_earned
          training_completed: true, // Mark personal account training as completed
          user_status: 'active', // Activate personal account
          updated_at: new Date().toISOString()
        })
        .eq('id', personalUser.id);

      if (updatePersonalError) {
        console.error('[SupabaseService] Error updating personal account:', updatePersonalError);
        return { success: false, error: 'Failed to update personal account: ' + updatePersonalError.message };
      }

      // Create transaction record for training account (debit - full balance reset)
      await this.createTransaction({
        user_id: trainingUserId,
        type: 'withdrawal',
        amount: trainingBalance,
        description: `Training completed - 2% ($${transferAmount}) transferred to personal account (${personalUser.email})`,
        status: 'completed'
      });

      // Create transaction record for personal account (credit - 2% only)
      await this.createTransaction({
        user_id: personalUser.id,
        type: 'earning',
        amount: transferAmount,
        description: `Training completed - 2% balance received from training account (${trainingUser.email})`,
        status: 'completed'
      });

      // Create 35 Phase 1 tasks for personal account
      const personalTasksCreated = await this.createTrainingTasks(personalUser.id, 35);
      if (!personalTasksCreated) {
        console.error('[SupabaseService] Failed to create personal account tasks');
      } else {
        console.log('[SupabaseService] Successfully created 35 Phase 1 tasks for personal account');
      }

      console.log(`[SupabaseService] Successfully transferred 2% ($${transferAmount}) from training to personal account`);

      return {
        success: true,
        transferredAmount: transferAmount,
      };
    } catch (error: any) {
      console.error('[SupabaseService] Exception completing training:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // TRANSACTION OPERATIONS
  // ===========================================
  
  static async createTransaction(transaction: Omit<DatabaseTransaction, 'id' | 'created_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert(transaction);
      
      if (error) {
        console.error('Error creating transaction:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception creating transaction:', error);
      return false;
    }
  }
  
  static async getUserTransactions(userId: string): Promise<DatabaseTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching transactions:', error);
        return [];
      }
      
      return data as DatabaseTransaction[];
    } catch (error) {
      console.error('Exception fetching transactions:', error);
      return [];
    }
  }
  
  // ===========================================
  // WITHDRAWAL OPERATIONS
  // ===========================================
  
  // Create a new withdrawal request
  static async createWithdrawalRequest(params: {
    userId: string;
    email: string;
    amount: number;
    walletAddress: string;
    walletType: string;
    currentBalance: number;
  }): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
    try {
      console.log('[Withdrawal] Creating withdrawal request:', params);
      
      // Check if there's already a pending withdrawal for this user
      console.log('[Withdrawal] Checking for existing pending withdrawals');
      const { data: existingPending, error: checkError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', params.userId)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('[Withdrawal] Error checking existing pending:', checkError);
      }
      
      if (existingPending) {
        console.error('[Withdrawal] User already has pending withdrawal:', existingPending.id);
        return { success: false, error: 'You already have a pending withdrawal request. Please wait for admin approval.' };
      }
      
      console.log('[Withdrawal] No existing pending withdrawal, proceeding with insert');
      
      // Create the withdrawal request
      const withdrawalData = {
        user_id: params.userId,
        user_email: params.email,
        amount: params.amount,
        wallet_address: params.walletAddress,
        wallet_type: params.walletType,
        status: 'pending',
        balance_snapshot: params.currentBalance,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('[Withdrawal] Inserting withdrawal data:', withdrawalData);
      
      const { data, error } = await supabase
        .from('withdrawals')
        .insert(withdrawalData)
        .select()
        .single();
      
      if (error) {
        console.error('[Withdrawal] Error creating withdrawal:', error);
        console.error('[Withdrawal] Error details:', { code: error.code, message: error.message, details: error.details });
        return { success: false, error: error.message };
      }
      
      console.log('[Withdrawal] Withdrawal record created successfully:', data.id);
      
      // Create a transaction record for this withdrawal request
      console.log('[Withdrawal] Creating transaction record');
      try {
        await this.createTransaction({
          user_id: params.userId,
          type: 'withdrawal_request',
          amount: params.amount,
          description: `Withdrawal request of $${params.amount.toFixed(2)} to ${params.walletType} wallet`,
          status: 'pending',
          metadata: {
            withdrawal_id: data.id,
            wallet_address: params.walletAddress,
            wallet_type: params.walletType,
            balance_before: params.currentBalance
          }
        });
        console.log('[Withdrawal] Transaction record created successfully');
      } catch (transactionError: any) {
        console.error('[Withdrawal] Error creating transaction record:', transactionError);
        // Don't fail the withdrawal if transaction creation fails
      }
      
      console.log('[Withdrawal] Created successfully:', data.id);
      
      // Send Telegram notification
      try {
        await TelegramService.sendWithdrawalNotification(params.email, params.email, params.amount);
      } catch (telegramError: any) {
        console.error('[Withdrawal] Telegram notification failed:', telegramError);
        // Don't fail the withdrawal if Telegram fails
      }
      
      return { success: true, withdrawalId: data.id };
    } catch (error: any) {
      console.error('[Withdrawal] Exception creating request:', error);
      console.error('[Withdrawal] Exception details:', { message: error.message, stack: error.stack });
      return { success: false, error: error.message || 'Failed to create withdrawal request' };
    }
  }
  
  // Get all withdrawals for a user
  static async getUserWithdrawals(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[Withdrawal] Error fetching user withdrawals:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[Withdrawal] Exception fetching withdrawals:', error);
      return [];
    }
  }
  
  // Check if user has pending withdrawal
  static async hasPendingWithdrawal(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[Withdrawal] Error checking pending:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('[Withdrawal] Exception checking pending:', error);
      return false;
    }
  }
  
  // ===========================================
  // ADMIN OPERATIONS
  // ===========================================
  
  static async getAllUsers(): Promise<DatabaseUser[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all users:', error);
        return [];
      }
      
      return data as DatabaseUser[];
    } catch (error) {
      console.error('Exception fetching all users:', error);
      return [];
    }
  }
  
  static async resetUserProgress(userId: string): Promise<boolean> {
    try {
      // Reset user stats
      const { error: userError } = await supabase
        .from('users')
        .update({
          training_progress: 0,
          tasks_completed: 0,
          balance: 0,
          total_earned: 0,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          profit_added: false,
          pending_product: null,
          trigger_task_number: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (userError) {
        console.error('Error resetting user:', userError);
        return false;
      }

      // Reset all tasks to locked except first
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting tasks:', deleteError);
        return false;
      }

      // Recreate 35 tasks for VIP1
      await this.createTrainingTasks(userId, 35);

      return true;
    } catch (error) {
      console.error('Exception resetting user:', error);
      return false;
    }
  }

  static async resetPersonalAccount(
    email: string,
    adminId?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log(`[SupabaseService] [ADMIN] Resetting personal account for: ${email}`);
      
      // Find the personal user - use maybeSingle() to handle 406 errors
      const { data: personalUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'personal')
        .maybeSingle();
      
      if (findError) {
        console.error(`[SupabaseService] [ADMIN] Error finding personal account: ${email}`, findError);
        return { success: false, error: 'Error finding personal account: ' + findError.message };
      }
      
      if (!personalUser) {
        console.error(`[SupabaseService] [ADMIN] Personal account not found: ${email}`);
        return { success: false, error: 'Personal account not found in Supabase' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Found personal user: ${personalUser.id}`);
      
      // Find linked training account (same email, training account_type) - use maybeSingle() to handle 406 errors
      const { data: trainingUser, error: trainingFindError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .maybeSingle();
      
      if (trainingFindError) {
        console.warn(`[SupabaseService] [ADMIN] Error finding training account (non-critical):`, trainingFindError);
        // Continue without training account - not critical for personal reset
      }
      
      if (trainingUser) {
        console.log(`[SupabaseService] [ADMIN] Found linked training user: ${trainingUser.id}`);
        
        // Update training account - set training_completed = true and training_progress = 35
        console.log(`[SupabaseService] [ADMIN] Updating linked training account...`);
        const { error: updateTrainingError } = await supabase
          .from('users')
          .update({
            training_completed: true,
            training_progress: 35,
            tasks_completed: 35,
            updated_at: new Date().toISOString()
          })
          .eq('id', trainingUser.id);
        
        if (updateTrainingError) {
          console.error(`[SupabaseService] [ADMIN] Error updating training account:`, updateTrainingError);
          // Don't fail the entire operation if training update fails
        } else {
          console.log(`[SupabaseService] [ADMIN] Training account updated successfully`);
        }
      }
      
      // Update personal account - reset to checkpoint values after first 35-task cycle completion
      console.log(`[SupabaseService] [ADMIN] Updating personal account to checkpoint values...`);
      const { error: updatePersonalError } = await supabase
        .from('users')
        .update({
          tasks_completed: 0,
          training_progress: 0,
          training_phase: 1,
          current_task_set: 0,
          personal_cycle: 1,
          personal_cycle_completed: true,
          set_1_completed_at: null,
          set_2_completed_at: null,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          trigger_task_number: 1,
          profit_added: false,
          // CRITICAL: Restore checkpoint balance and total_earned after first 35-task cycle
          // Do NOT preserve latest balance - rollback to phase 1 completion state
          balance: 61.38,
          total_earned: 10.25,
          updated_at: new Date().toISOString()
        })
        .eq('id', personalUser.id);
      
      if (updatePersonalError) {
        console.error(`[SupabaseService] [ADMIN] Error updating personal account:`, updatePersonalError);
        return { success: false, error: 'Failed to update personal account' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Personal account updated successfully`);
      
      // Delete all existing tasks for this user
      console.log(`[SupabaseService] [ADMIN] Deleting existing tasks...`);
      const { error: deleteTasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', personalUser.id);
      
      if (deleteTasksError) {
        console.error(`[SupabaseService] [ADMIN] Error deleting tasks:`, deleteTasksError);
        return { success: false, error: 'Failed to delete existing tasks' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Existing tasks deleted successfully`);
      
      // Recreate 35 Phase 1 tasks for personal account
      console.log(`[SupabaseService] [ADMIN] Creating 35 new tasks...`);
      const tasksCreated = await this.createTrainingTasks(personalUser.id, 35);
      if (!tasksCreated) {
        console.error(`[SupabaseService] [ADMIN] Failed to recreate tasks`);
        return { success: false, error: 'Failed to recreate tasks' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Tasks recreated successfully`);
      
      // CRITICAL FIX: Ensure task 2 is unlocked immediately after task 1 is created
      // This prevents the "stuck at 1/35" bug
      console.log(`[SupabaseService] [ADMIN] Ensuring task 2 is unlocked for progression...`);
      const { error: unlockError } = await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('user_id', personalUser.id)
        .eq('task_number', 2);
      
      if (unlockError) {
        console.warn(`[SupabaseService] [ADMIN] Warning: Failed to unlock task 2 (may be normal):`, unlockError);
      } else {
        console.log(`[SupabaseService] [ADMIN] Task 2 unlocked successfully`);
      }
      
      // Log admin action
      await this.logAdminAction('RESET_PERSONAL_ACCOUNT', personalUser.id, {
        email,
        updated_training_account: !!trainingUser,
        restored_balance: 61.38,
        restored_total_earned: 10.25
      });
      
      const message = `Personal account reset to 0/35 (Cycle 1). Training account marked as completed (35/35). Balance restored to checkpoint ($61.38, total_earned: $10.25).`;
      
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      console.log(`[SupabaseService] [ADMIN] RESET SUCCESSFUL`);
      console.log(`[SupabaseService] [ADMIN] ${message}`);
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      
      return { success: true, message };
    } catch (error) {
      console.error(`[SupabaseService] [ADMIN] Exception resetting personal account:`, error);
      return { success: false, error: 'Exception during reset' };
    }
  }

  static async resetPersonalAccountTasks(userId: string): Promise<boolean> {
    try {
      // Get user to verify it's a personal account
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('account_type, balance, total_earned')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('[resetPersonalAccountTasks] Error fetching user:', userError);
        return false;
      }

      if (user.account_type !== 'personal') {
        console.error('[resetPersonalAccountTasks] User is not a personal account');
        return false;
      }

      // Delete all existing tasks
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('[resetPersonalAccountTasks] Error deleting tasks:', deleteError);
        return false;
      }

      // Recreate 35 Phase 1 tasks for personal account (preserves balance)
      const tasksCreated = await this.createTrainingTasks(userId, 35);
      if (!tasksCreated) {
        console.error('[resetPersonalAccountTasks] Failed to recreate tasks');
        return false;
      }

      console.log(`[resetPersonalAccountTasks] Successfully reset tasks for personal account ${userId} (balance preserved: $${user.balance})`);
      return true;
    } catch (error) {
      console.error('[resetPersonalAccountTasks] Exception resetting personal account tasks:', error);
      return false;
    }
  }
  
  static async updateUserBalance(userId: string, newBalance: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating balance:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception updating balance:', error);
      return false;
    }
  }
  
  static async logAdminAction(action: string, userId?: string, details?: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_logs')
        .insert({
          action,
          user_id: userId,
          admin_id: user?.id,
          details,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error logging admin action:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Exception logging admin action:', error);
      return false;
    }
  }
  
  // ===========================================
  // ADMIN: WITHDRAWAL MANAGEMENT
  // ===========================================
  
  // Get all pending withdrawal requests for admin
  static async getAllPendingWithdrawals(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users:user_id (display_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[AdminWithdrawal] Error fetching pending withdrawals:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[AdminWithdrawal] Exception fetching withdrawals:', error);
      return [];
    }
  }
  
  // Get all withdrawals (for admin view with filters)
  static async getAllWithdrawals(status?: 'pending' | 'approved' | 'rejected' | 'completed'): Promise<any[]> {
    try {
      let query = supabase
        .from('withdrawals')
        .select(`
          *,
          users:user_id (display_name, email)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[AdminWithdrawal] Error fetching withdrawals:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('[AdminWithdrawal] Exception fetching withdrawals:', error);
      return [];
    }
  }
  
  // Approve a withdrawal request
  static async approveWithdrawal(
    withdrawalId: string,
    adminId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminWithdrawal] Approving withdrawal:', withdrawalId);
      
      // Get the withdrawal details
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();
      
      if (fetchError || !withdrawal) {
        console.error('[AdminWithdrawal] Error fetching withdrawal:', fetchError);
        return { success: false, error: 'Withdrawal not found' };
      }
      
      if (withdrawal.status !== 'pending') {
        return { success: false, error: `Withdrawal is already ${withdrawal.status}` };
      }
      
      const now = new Date().toISOString();
      
      // Update withdrawal status to approved
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          processed_at: now,
          updated_at: now,
          reviewed_by: adminId || null
        })
        .eq('id', withdrawalId);
      
      if (updateError) {
        console.error('[AdminWithdrawal] Error updating withdrawal:', updateError);
        return { success: false, error: updateError.message };
      }
      
      // For training accounts - update training account balance and user balance
      const { data: userData } = await supabase
        .from('users')
        .select('account_type, balance, total_earned, email')
        .eq('id', withdrawal.user_id)
        .single();
      
      if (userData?.account_type === 'training') {
        // Update training account amount
        const { data: trainingAccount } = await supabase
          .from('training_accounts')
          .select('amount')
          .eq('auth_user_id', withdrawal.user_id)
          .single();
        
        if (trainingAccount) {
          const newAmount = Math.max(0, trainingAccount.amount - withdrawal.amount);
          await supabase
            .from('training_accounts')
            .update({ amount: newAmount, updated_at: now })
            .eq('auth_user_id', withdrawal.user_id);
          
          // Update user balance
          const newBalance = Math.max(0, userData.balance - withdrawal.amount);
          const newTotalEarned = Math.max(0, userData.total_earned - withdrawal.amount);
          
          await supabase
            .from('users')
            .update({ 
              balance: newBalance, 
              total_earned: newTotalEarned,
              updated_at: now 
            })
            .eq('id', withdrawal.user_id);
        }
      } else {
        // For personal accounts - just update user balance
        const newBalance = Math.max(0, userData?.balance - withdrawal.amount || 0);
        await supabase
          .from('users')
          .update({ balance: newBalance, updated_at: now })
          .eq('id', withdrawal.user_id);
      }
      
      // Create completed transaction record
      await this.createTransaction({
        user_id: withdrawal.user_id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        description: `Withdrawal of $${withdrawal.amount.toFixed(2)} approved and sent to ${withdrawal.wallet_type} wallet`,
        status: 'completed',
        metadata: {
          withdrawal_id: withdrawalId,
          wallet_address: withdrawal.wallet_address,
          wallet_type: withdrawal.wallet_type,
          admin_id: adminId,
          processed_at: now
        }
      });
      
      // Log admin action
      await this.logAdminAction(
        adminId || 'system',
        'approve_withdrawal',
        `Approved withdrawal of $${withdrawal.amount.toFixed(2)} for user ${withdrawal.user_email}`,
        withdrawal.user_id,
        { withdrawal_id: withdrawalId, amount: withdrawal.amount }
      );
      
      // Send notification
      TelegramService.sendWithdrawalApprovedNotification({
        userId: withdrawal.user_id,
        userEmail: withdrawal.user_email,
        amount: withdrawal.amount,
        walletType: withdrawal.wallet_type,
        timestamp: now
      });
      
      console.log('[AdminWithdrawal] Successfully approved withdrawal:', withdrawalId);
      return { success: true };
    } catch (error: any) {
      console.error('[AdminWithdrawal] Exception approving withdrawal:', error);
      return { success: false, error: error.message || 'Failed to approve withdrawal' };
    }
  }
  
  // Reject a withdrawal request
  static async rejectWithdrawal(
    withdrawalId: string,
    adminId?: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[AdminWithdrawal] Rejecting withdrawal:', withdrawalId);
      
      // Get the withdrawal details
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();
      
      if (fetchError || !withdrawal) {
        console.error('[AdminWithdrawal] Error fetching withdrawal:', fetchError);
        return { success: false, error: 'Withdrawal not found' };
      }
      
      if (withdrawal.status !== 'pending') {
        return { success: false, error: `Withdrawal is already ${withdrawal.status}` };
      }
      
      const now = new Date().toISOString();
      
      // Update withdrawal status to rejected
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          processed_at: now,
          updated_at: now,
          reviewed_by: adminId || null,
          notes: reason || 'Rejected by admin'
        })
        .eq('id', withdrawalId);
      
      if (updateError) {
        console.error('[AdminWithdrawal] Error updating withdrawal:', updateError);
        return { success: false, error: updateError.message };
      }
      
      // Create rejected transaction record
      await this.createTransaction({
        user_id: withdrawal.user_id,
        type: 'withdrawal',
        amount: withdrawal.amount,
        description: `Withdrawal of $${withdrawal.amount.toFixed(2)} rejected: ${reason || 'Rejected by admin'}`,
        status: 'failed',
        metadata: {
          withdrawal_id: withdrawalId,
          wallet_address: withdrawal.wallet_address,
          wallet_type: withdrawal.wallet_type,
          admin_id: adminId,
          processed_at: now,
          rejection_reason: reason
        }
      });
      
      // Log admin action
      await this.logAdminAction(
        adminId || 'system',
        'reject_withdrawal',
        `Rejected withdrawal of $${withdrawal.amount.toFixed(2)} for user ${withdrawal.user_email}: ${reason || 'No reason provided'}`,
        withdrawal.user_id,
        { withdrawal_id: withdrawalId, amount: withdrawal.amount, reason }
      );
      
      console.log('[AdminWithdrawal] Successfully rejected withdrawal:', withdrawalId);
      return { success: true };
    } catch (error: any) {
      console.error('[AdminWithdrawal] Exception rejecting withdrawal:', error);
      return { success: false, error: error.message || 'Failed to reject withdrawal' };
    }
  }
  
  // ===========================================
  // ADMIN: RESET TRAINING ACCOUNT
  // ===========================================
  
  static async resetTrainingAccount(
    email: string,
    adminId?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log(`[SupabaseService] [ADMIN] Resetting training account for: ${email}`);
      
      // Find the training user
      const { data: trainingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (findError || !trainingUser) {
        console.error(`[SupabaseService] [ADMIN] Training account not found: ${email}`, findError);
        return { success: false, error: 'Training account not found in Supabase' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Found training user: ${trainingUser.id}`);
      console.log(`[SupabaseService] [ADMIN] users.training_phase: ${trainingUser.training_phase}`);
      
      // Get training account to check REAL task progress (task_number) and preserve balance
      const { data: trainingAccount, error: accountError } = await supabase
        .from('training_accounts')
        .select('*')
        .eq('auth_user_id', trainingUser.id)
        .single();
      
      if (accountError) {
        console.error(`[SupabaseService] [ADMIN] Training account record not found:`, accountError);
        return { success: false, error: 'Training account not found in training_accounts table' };
      }
      
      // Check Phase 1 completion from the REAL task_number (not users.tasks_completed)
      const currentTaskNumber = trainingAccount?.task_number || 0;
      const isPhase1Complete = Number(trainingUser.training_phase) === 1 && currentTaskNumber >= 45;
      const newPhase = isPhase1Complete ? 2 : 1;
      
      console.log(`[SupabaseService] [ADMIN] training_accounts.task_number: ${currentTaskNumber}`);
      console.log(`[SupabaseService] [ADMIN] isPhase1Complete (task_number >= 45): ${isPhase1Complete}`);
      console.log(`[SupabaseService] [ADMIN] newPhase: ${newPhase}`);
      
      const currentBalance = trainingAccount?.amount || trainingUser.balance || 0;
      const totalEarned = trainingUser.total_earned || Math.max(0, currentBalance - 1100);
      
      console.log(`[SupabaseService] [ADMIN] Preserved balance: $${currentBalance}`);
      console.log(`[SupabaseService] [ADMIN] Preserved total_earned: $${totalEarned}`);
      
      // Update users table - reset progress but preserve balance and total_earned
      console.log(`[SupabaseService] [ADMIN] Updating public.users table...`);
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          tasks_completed: 0,
          training_progress: 0,
          training_phase: newPhase,
          current_task_set: newPhase === 2 ? 2 : 1, // Set 2 if moving to Phase 2, otherwise Set 1
          set_1_completed_at: newPhase === 2 ? new Date().toISOString() : null, // Mark Set 1 as completed if moving to Phase 2
          set_2_completed_at: null, // Clear Set 2 completion timestamp
          balance: currentBalance, // Preserve balance
          total_earned: totalEarned, // Preserve total earned
          account_type: 'training',
          user_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingUser.id);
      
      if (updateUserError) {
        console.error(`[SupabaseService] [ADMIN] Error updating user:`, updateUserError);
        return { success: false, error: 'Failed to update user: ' + updateUserError.message };
      }
      
      console.log(`[SupabaseService] [ADMIN] User updated successfully`);
      
      // Update training_accounts table - reset task_number to 0, preserve balance
      // Note: Only update columns that actually exist: task_number, amount, commission, status
      if (trainingAccount) {
        console.log(`[SupabaseService] [ADMIN] Updating training_accounts table...`);
        const { error: updateAccountError } = await supabase
          .from('training_accounts')
          .update({
            task_number: 0, // Reset to 0 (will become task 1 when user starts)
            amount: currentBalance, // Preserve balance
            commission: 0, // Reset commission
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', trainingAccount.id);
        
        if (updateAccountError) {
          console.error(`[SupabaseService] [ADMIN] Error updating training account:`, updateAccountError);
          return { success: false, error: 'Failed to update training account: ' + updateAccountError.message };
        }
        
        console.log(`[SupabaseService] [ADMIN] Training account updated: task_number=0, amount=$${currentBalance}, commission=0`);
      }

      // Clear localStorage to prevent stale task state after reset
      const userEmail = email.toLowerCase();
      localStorage.removeItem(`training_account_${userEmail}`);
      localStorage.removeItem(`training_tasks_${userEmail}`);
      localStorage.removeItem(`training_wallet_${userEmail}`);
      localStorage.removeItem(`training_history_${userEmail}`);
      localStorage.removeItem(`training_current_task_set_${userEmail}`);
      localStorage.removeItem(`training_completed_sets_${userEmail}`);
      console.log(`[SupabaseService] [ADMIN] Cleared localStorage for user: ${userEmail}`);

      // Delete old phase2_checkpoints rows when moving to Phase 2 (clean slate)
      // OR when resetting to Phase 1 (prevent data leakage)
      if (newPhase === 2 || newPhase === 1) {
        console.log(`[SupabaseService] [ADMIN] Deleting old phase2_checkpoints for user: ${trainingUser.id}`);
        const { error: deleteCheckpointError } = await supabase
          .from('phase2_checkpoints')
          .delete()
          .eq('auth_user_id', trainingUser.id);
        
        if (deleteCheckpointError) {
          console.error(`[SupabaseService] [ADMIN] Error deleting old checkpoints:`, deleteCheckpointError);
          // Don't fail the reset if checkpoint deletion fails
        } else {
          console.log(`[SupabaseService] [ADMIN] Old phase2_checkpoints deleted successfully`);
        }
      }
      
      // Log admin action
      await this.logAdminAction('reset_training_account', trainingUser.id, {
        email,
        previous_phase: trainingUser.training_phase,
        new_phase: newPhase,
        balance_preserved: currentBalance,
        admin_id: adminId
      });
      
      const phaseMessage = newPhase === 2 
        ? 'PHASE 2 ACTIVATED: User moved to Phase 2 (0/45 tasks), balance preserved'
        : 'PHASE 1 RESET: Tasks reset to 0/45, balance preserved';
      
      console.log(`[SupabaseService] [ADMIN] Training account reset complete: ${phaseMessage}`);
      
      return { 
        success: true, 
        message: phaseMessage
      };
    } catch (error: any) {
      console.error('[SupabaseService] [ADMIN] Exception resetting training account:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // ADMIN: APPROVE CHECKPOINT (Remove Pending Order)
  // ===========================================
  // This approves the checkpoint so user can submit premium product
  // Bonus is NOT added yet - that happens when user clicks "Submit Premium Product"
  
  static async removePendingOrder(
    email: string,
    adminId?: string
  ): Promise<{ success: boolean; checkpointId?: string; bonusAmount?: number; error?: string }> {
    try {
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      console.log(`[SupabaseService] [ADMIN] APPROVE CHECKPOINT for: ${email}`);
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      
      // Step 1: Find the training user by email
      console.log(`[SupabaseService] [ADMIN] Step 1: Searching for training user with email: ${email}`);
      const { data: trainingUser, error: findError } = await supabase
        .from('users')
        .select('id, email, display_name, account_type')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (findError || !trainingUser) {
        console.error(`[SupabaseService] [ADMIN] Training account not found: ${email}`, findError);
        return { success: false, error: 'Training account not found in Supabase' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Step 1: FOUND training user:`, {
        id: trainingUser.id,
        email: trainingUser.email,
        display_name: trainingUser.display_name
      });
      
      // Step 2: Find checkpoint by user ID (auth_user_id or user_id)
      console.log(`[SupabaseService] [ADMIN] Step 2: Searching checkpoint for user_id: ${trainingUser.id}`);
      console.log(`[SupabaseService] [ADMIN] Checkpoint filters:`, {
        auth_user_id: trainingUser.id,
        status: 'pending_review',
        task_number: [31, 32]
      });
      
      // Try finding by auth_user_id first
      let { data: checkpoint, error: checkpointError } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('auth_user_id', trainingUser.id)
        .eq('status', 'pending_review')
        .in('task_number', [31, 32])
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      // If not found, try by user_id
      if (!checkpoint && !checkpointError) {
        console.log(`[SupabaseService] [ADMIN] Checkpoint not found by auth_user_id, trying user_id...`);
        const result = await supabase
          .from('phase2_checkpoints')
          .select('*')
          .eq('user_id', trainingUser.id)
          .eq('status', 'pending_review')
          .in('task_number', [31, 32])
          .order('created_at', { ascending: false })
          .maybeSingle();
        checkpoint = result.data;
        checkpointError = result.error;
      }
      
      // If still not found, try by email
      if (!checkpoint && !checkpointError) {
        console.log(`[SupabaseService] [ADMIN] Checkpoint not found by user_id, trying email...`);
        const result = await supabase
          .from('phase2_checkpoints')
          .select('*')
          .eq('email', email)
          .eq('status', 'pending_review')
          .in('task_number', [31, 32])
          .order('created_at', { ascending: false })
          .maybeSingle();
        checkpoint = result.data;
        checkpointError = result.error;
      }
      
      if (checkpointError) {
        console.error(`[SupabaseService] [ADMIN] Error fetching checkpoint:`, checkpointError);
        return { success: false, error: 'Error fetching checkpoint: ' + checkpointError.message };
      }
      
      if (!checkpoint) {
        console.error(`[SupabaseService] [ADMIN] No pending checkpoint found for: ${email}`);
        console.log(`[SupabaseService] [ADMIN] Searching for ANY checkpoint for this user...`);
        
        // Debug: Show all checkpoints for this user
        const { data: allCheckpoints } = await supabase
          .from('phase2_checkpoints')
          .select('id, task_number, status, created_at')
          .eq('auth_user_id', trainingUser.id);
        
        console.log(`[SupabaseService] [ADMIN] All checkpoints for user:`, allCheckpoints);
        
        return { success: false, error: 'No pending checkpoint found for this user. Checkpoint must be in pending_review status.' };
      }
      
      console.log(`[SupabaseService] [ADMIN] Step 2: FOUND checkpoint:`, {
        id: checkpoint.id,
        task_number: checkpoint.task_number,
        status: checkpoint.status,
        bonus_amount: checkpoint.bonus_amount,
        product1_name: checkpoint.product1_name,
        product2_name: checkpoint.product2_name
      });
      
      // Step 3: Update checkpoint to 'approved'
      console.log(`[SupabaseService] [ADMIN] Step 3: Updating checkpoint...`);
      console.log(`[SupabaseService] [ADMIN] Checkpoint ID: ${checkpoint.id}`);
      console.log(`[SupabaseService] [ADMIN] Old status: ${checkpoint.status}`);
      console.log(`[SupabaseService] [ADMIN] New status: approved`);
      console.log(`[SupabaseService] [ADMIN] reviewed_by field: SKIPPED (not updating UUID field)`);
      
      const { error: updateError } = await supabase
        .from('phase2_checkpoints')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          notes: 'Pending order removed by admin - awaiting user to submit premium product',
          updated_at: new Date().toISOString()
        })
        .eq('id', checkpoint.id);
      
      if (updateError) {
        console.error(`[SupabaseService] [ADMIN] Error updating checkpoint:`, updateError);
        return { success: false, error: 'Failed to approve checkpoint: ' + updateError.message };
      }
      
      console.log(`[SupabaseService] [ADMIN] Step 3: SUCCESS - Checkpoint ${checkpoint.id} approved`);
      console.log(`[SupabaseService] [ADMIN] Status changed: ${checkpoint.status} -> approved`);
      
      // Step 4: Also update the training_accounts to clear has_pending_order flag
      console.log(`[SupabaseService] [ADMIN] Step 4: Clearing has_pending_order flag in training_accounts`);
      
      const { data: trainingAccount } = await supabase
        .from('training_accounts')
        .select('id')
        .eq('auth_user_id', trainingUser.id)
        .single();
      
      if (trainingAccount) {
        const updatePayload = {
          updated_at: new Date().toISOString()
        };
        console.log('[SupabaseService] [ADMIN] Step 4: Full training_accounts update payload:', JSON.stringify(updatePayload, null, 2));
        console.log('[SupabaseService] [ADMIN] Step 4: Filter: id =', trainingAccount.id);
        const { error: trainingUpdateError } = await supabase
          .from('training_accounts')
          .update(updatePayload)
          .eq('id', trainingAccount.id);
        
        if (trainingUpdateError) {
          console.error('[SupabaseService] [ADMIN] Step 4: ERROR updating training_accounts:', trainingUpdateError);
          console.error('[SupabaseService] [ADMIN] Step 4: Error details:', JSON.stringify(trainingUpdateError, null, 2));
        } else {
          console.log('[SupabaseService] [ADMIN] Step 4: SUCCESS - training_accounts updated');
        }
        
        console.log(`[SupabaseService] [ADMIN] Step 4: Training account updated`);
      }
      
      // Step 5: Log admin action
      await this.logAdminAction('approve_checkpoint', trainingUser.id, {
        email,
        checkpoint_id: checkpoint.id,
        task_number: checkpoint.task_number,
        bonus_amount: checkpoint.bonus_amount,
        previous_status: 'pending_review',
        new_status: 'approved',
        admin_id: adminId,
        note: 'Admin approved checkpoint - user must now submit premium product to receive bonus'
      });

      // Step 6: Create transaction record for checkpoint approval (bonus will be added when user submits)
      await this.createTransaction({
        user_id: trainingUser.id,
        type: 'phase2_checkpoint_approved',
        amount: 0,
        description: `Phase 2 checkpoint approved at task ${checkpoint.task_number}. User must submit product to receive bonus.`,
        status: 'completed',
        metadata: { checkpoint_id: checkpoint.id, admin_id: adminId, pending_bonus: checkpoint.bonus_amount }
      });
      
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      console.log(`[SupabaseService] [ADMIN] CHECKPOINT APPROVAL COMPLETE`);
      console.log(`[SupabaseService] [ADMIN] User: ${email}`);
      console.log(`[SupabaseService] [ADMIN] Checkpoint: ${checkpoint.id}`);
      console.log(`[SupabaseService] [ADMIN] Bonus Amount (pending user submission): $${checkpoint.bonus_amount}`);
      console.log(`[SupabaseService] [ADMIN] ==========================================`);
      
      return { 
        success: true, 
        checkpointId: checkpoint.id,
        bonusAmount: checkpoint.bonus_amount
      };
    } catch (error: any) {
      console.error('[SupabaseService] [ADMIN] Exception in removePendingOrder:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // ADMIN: ADD BALANCE
  // ===========================================
  
  static async adminAddBalance(
    email: string,
    amount: number,
    reason: string,
    adminId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      console.log(`[SupabaseService] [ADMIN] Adding $${amount} to ${email}. Reason: ${reason}`);
      
      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (findError || !user) {
        console.error(`[SupabaseService] [ADMIN] User not found: ${email}`, findError);
        return { success: false, error: 'User not found in Supabase' };
      }
      
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + amount;
      
      console.log(`[SupabaseService] [ADMIN] Current balance: $${currentBalance}, New balance: $${newBalance}`);
      
      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          total_earned: (user.total_earned || 0) + amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`[SupabaseService] [ADMIN] Error updating balance:`, updateError);
        return { success: false, error: 'Failed to update balance: ' + updateError.message };
      }
      
      // Also update training_accounts if it's a training account
      if (user.account_type === 'training') {
        const { data: trainingAccount } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        if (trainingAccount) {
          await supabase
            .from('training_accounts')
            .update({
              amount: newBalance,
              total_earned: (trainingAccount.total_earned || 0) + amount,
              updated_at: new Date().toISOString()
            })
            .eq('id', trainingAccount.id);
        }
      }
      
      // Create transaction record
      await this.createTransaction({
        user_id: user.id,
        type: 'admin_adjustment',
        amount: amount,
        description: `Admin added balance: ${reason}`,
        status: 'completed',
        metadata: { 
          previous_balance: currentBalance,
          new_balance: newBalance,
          reason,
          admin_id: adminId
        }
      });
      
      // Log admin action
      await this.logAdminAction('add_balance', user.id, {
        email,
        amount,
        reason,
        previous_balance: currentBalance,
        new_balance: newBalance,
        admin_id: adminId
      });
      
      console.log(`[SupabaseService] [ADMIN] Balance added successfully. New balance: $${newBalance}`);
      
      return { success: true, newBalance };
    } catch (error: any) {
      console.error('[SupabaseService] [ADMIN] Exception adding balance:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // ADMIN: REDUCE BALANCE
  // ===========================================
  
  static async adminReduceBalance(
    email: string,
    amount: number,
    reason: string,
    adminId?: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    try {
      console.log(`[SupabaseService] [ADMIN] Reducing balance by $${amount} for ${email}. Reason: ${reason}`);
      
      // Find user
      const { data: user, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (findError || !user) {
        console.error(`[SupabaseService] [ADMIN] User not found: ${email}`, findError);
        return { success: false, error: 'User not found in Supabase' };
      }
      
      const currentBalance = user.balance || 0;
      
      // Prevent negative balance
      if (currentBalance < amount) {
        console.error(`[SupabaseService] [ADMIN] Insufficient balance: $${currentBalance} < $${amount}`);
        return { success: false, error: `Insufficient balance. Current: $${currentBalance}, Requested: $${amount}` };
      }
      
      const newBalance = currentBalance - amount;
      
      console.log(`[SupabaseService] [ADMIN] Current balance: $${currentBalance}, New balance: $${newBalance}`);
      
      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`[SupabaseService] [ADMIN] Error updating balance:`, updateError);
        return { success: false, error: 'Failed to update balance: ' + updateError.message };
      }
      
      // Also update training_accounts if it's a training account
      if (user.account_type === 'training') {
        const { data: trainingAccount } = await supabase
          .from('training_accounts')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();
        
        if (trainingAccount) {
          await supabase
            .from('training_accounts')
            .update({
              amount: newBalance,
              updated_at: new Date().toISOString()
            })
            .eq('id', trainingAccount.id);
        }
      }
      
      // Create transaction record
      await this.createTransaction({
        user_id: user.id,
        type: 'admin_adjustment',
        amount: -amount,
        description: `Admin reduced balance: ${reason}`,
        status: 'completed',
        metadata: { 
          previous_balance: currentBalance,
          new_balance: newBalance,
          reason,
          admin_id: adminId
        }
      });
      
      // Log admin action
      await this.logAdminAction('reduce_balance', user.id, {
        email,
        amount,
        reason,
        previous_balance: currentBalance,
        new_balance: newBalance,
        admin_id: adminId
      });
      
      console.log(`[SupabaseService] [ADMIN] Balance reduced successfully. New balance: $${newBalance}`);
      
      return { success: true, newBalance };
    } catch (error: any) {
      console.error('[SupabaseService] [ADMIN] Exception reducing balance:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ===========================================
  // TRAINING ACCOUNT OPERATIONS
  // ===========================================
  
  static async createTrainingAccount(account: Omit<DatabaseTrainingAccount, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseTrainingAccount | null> {
    try {
      const { data, error } = await supabase
        .from('training_accounts')
        .insert(account)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating training account:', error);
        return null;
      }
      
      return data as DatabaseTrainingAccount;
    } catch (error) {
      console.error('Exception creating training account:', error);
      return null;
    }
  }
  
  static async getTrainingAccounts(): Promise<DatabaseTrainingAccount[]> {
    try {
      const { data, error } = await supabase
        .from('training_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching training accounts:', error);
        return [];
      }
      
      return data as DatabaseTrainingAccount[];
    } catch (error) {
      console.error('Exception fetching training accounts:', error);
      return [];
    }
  }
  
  static async validateTrainingAccount(email: string, password: string): Promise<DatabaseUser | null> {
    // DISABLED: Training accounts now use Supabase auth only
    // localStorage is no longer the source of truth
    console.log('[validateTrainingAccount] DISABLED - Use Supabase auth via loginTrainingAccount instead');
    return null;
  }
  
  // ===========================================
  // PHASE 2 CHECKPOINT OPERATIONS
  // ===========================================
  
  static async createPhase2Checkpoint(
    authUserId: string,
    email: string,
    taskNumber: number,
    product1: { name: string; image: string; price: number },
    product2: { name: string; image: string; price: number },
    bonusAmount: number = 100
  ): Promise<Phase2Checkpoint | null> {
    try {
      // Check if ANY checkpoint already exists for this user (prevents duplicates)
      // Only ONE checkpoint allowed per Phase 2 training
      const { data: existing } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .in('status', ['pending_review', 'approved', 'completed', 'submitted', 'bonus_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        console.log('[Phase2Checkpoint] DUPLICATE PREVENTED - Phase 2 checkpoint already exists:', existing.id, 'status:', existing.status, 'task:', existing.task_number);
        console.log('[Phase2Checkpoint] Returning existing checkpoint instead of creating new one');
        return existing as Phase2Checkpoint;
      }
      
      // Get current training account balance to calculate proper bonus
      const { data: trainingAccount } = await supabase
        .from('training_accounts')
        .select('amount')
        .eq('auth_user_id', authUserId)
        .single();
      
      const currentBalance = trainingAccount?.amount || 1265.60; // Default to Phase 1 end balance
      
      // TARGET: Final balance must be exactly $2423.30
      const TARGET_FINAL_BALANCE = 2423.30;
      const INITIAL_TRAINING_BALANCE = 1100.00;
      const TOTAL_EARNED_TARGET = TARGET_FINAL_BALANCE - INITIAL_TRAINING_BALANCE; // $1323.30
      
      // Calculate combination value from actual product prices (for display only)
      const combinationValue = product1.price + product2.price;
      
      // Calculate remaining tasks after checkpoint (assuming checkpoint at task 31-32)
      // Phase 2 has 45 tasks total, checkpoint is around task 31-32
      const remainingTasksAfterCheckpoint = Math.max(0, 45 - taskNumber);
      
      // Estimate remaining normal task rewards (approx $3.68 per task based on Phase 1 scale)
      const estimatedTaskReward = 165.60 / 45; // Phase 1 total / 45 tasks
      const remainingTaskRewards = remainingTasksAfterCheckpoint * estimatedTaskReward;
      
      // Calculate required bonus to hit target final balance
      // Formula: bonus = target - current_balance - remaining_task_rewards
      const requiredTotalEarnings = TARGET_FINAL_BALANCE - currentBalance;
      const calculatedBonus = Math.max(0, requiredTotalEarnings - remainingTaskRewards);
      
      // Round to 2 decimal places with exact precision to avoid floating-point issues
      const finalBonus = Number(calculatedBonus.toFixed(2));
      
      console.log('[Phase2Checkpoint] TARGET FINAL BALANCE:', TARGET_FINAL_BALANCE);
      console.log('[Phase2Checkpoint] Current balance:', currentBalance);
      console.log('[Phase2Checkpoint] Remaining tasks after checkpoint:', remainingTasksAfterCheckpoint);
      console.log('[Phase2Checkpoint] Estimated remaining task rewards:', remainingTaskRewards.toFixed(2));
      console.log('[Phase2Checkpoint] Required total earnings to reach target:', requiredTotalEarnings.toFixed(2));
      console.log('[Phase2Checkpoint] Calculated checkpoint bonus:', finalBonus);
      console.log('[Phase2Checkpoint] Product 1:', product1.name, '$' + product1.price);
      console.log('[Phase2Checkpoint] Product 2:', product2.name, '$' + product2.price);
      console.log('[Phase2Checkpoint] Combination value (for display):', combinationValue);
      
      const { data, error } = await supabase
        .from('phase2_checkpoints')
        .insert({
          user_id: authUserId,
          auth_user_id: authUserId,
          email,
          phase: 2,
          task_number: taskNumber,
          status: 'pending_review',
          product1_name: product1.name,
          product1_image: product1.image,
          product1_price: product1.price,
          product2_name: product2.name,
          product2_image: product2.image,
          product2_price: product2.price,
          combination_value: combinationValue,
          bonus_amount: finalBonus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[Phase2Checkpoint] Error creating checkpoint:', error);
        return null;
      }
      
      console.log('[Phase2Checkpoint] Created checkpoint for task', taskNumber, 'user:', email);
      return data as Phase2Checkpoint;
    } catch (error) {
      console.error('[Phase2Checkpoint] Exception creating checkpoint:', error);
      return null;
    }
  }
  
  static async getUserPendingCheckpoint(authUserId: string): Promise<Phase2Checkpoint | null> {
    try {
      console.log('[Checkpoint] Service - Fetching pending checkpoint for user:', authUserId);
      
      const { data, error } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('status', 'pending_review')
        .maybeSingle();
      
      if (error) {
        console.error('[Checkpoint] Service - Error fetching checkpoint:', error);
        return null;
      }
      
      if (data) {
        console.log('[Checkpoint] Service - Found pending checkpoint:', data.id, 'at task', data.task_number);
      } else {
        console.log('[Checkpoint] Service - No pending checkpoint found');
      }
      
      return data as Phase2Checkpoint | null;
    } catch (error) {
      console.error('[Checkpoint] Service - Exception fetching checkpoint:', error);
      return null;
    }
  }
  
  static async getCheckpointByTask(authUserId: string, taskNumber: number): Promise<Phase2Checkpoint | null> {
    try {
      console.log('[Checkpoint] Service - Fetching checkpoint for user:', authUserId, 'task:', taskNumber);
      
      // Get ANY checkpoint for this user and task (regardless of status)
      const { data, error } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('task_number', taskNumber)
        .maybeSingle();
      
      if (error) {
        console.error('[Checkpoint] Service - Error fetching checkpoint by task:', error);
        return null;
      }
      
      if (data) {
        console.log('[Checkpoint] Service - Found checkpoint:', data.id, 'status:', data.status);
      } else {
        console.log('[Checkpoint] Service - No checkpoint found for task', taskNumber);
      }
      
      return data as Phase2Checkpoint | null;
    } catch (error) {
      console.error('[Checkpoint] Service - Exception fetching checkpoint by task:', error);
      return null;
    }
  }
  
  // Check if ANY Phase 2 checkpoint exists for this user (regardless of task_number)
  // This prevents duplicate checkpoints - only ONE checkpoint allowed per Phase 2
  static async getAnyPhase2Checkpoint(authUserId: string): Promise<Phase2Checkpoint | null> {
    try {
      console.log('[Checkpoint] Service - Checking for ANY existing Phase 2 checkpoint for user:', authUserId);
      
      const { data, error } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .in('status', ['pending_review', 'approved', 'completed', 'submitted', 'bonus_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('[Checkpoint] Service - Error checking for any checkpoint:', error);
        return null;
      }
      
      if (data) {
        console.log('[Checkpoint] Service - Found existing Phase 2 checkpoint:', data.id, 'status:', data.status, 'task:', data.task_number);
      } else {
        console.log('[Checkpoint] Service - No existing Phase 2 checkpoint found - safe to create new one');
      }
      
      return data as Phase2Checkpoint | null;
    } catch (error) {
      console.error('[Checkpoint] Service - Exception checking for any checkpoint:', error);
      return null;
    }
  }
  
  static async getAllPendingCheckpoints(): Promise<Phase2Checkpoint[]> {
    try {
      const { data, error } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[Phase2Checkpoint] Error fetching checkpoints:', error);
        return [];
      }
      
      return data as Phase2Checkpoint[];
    } catch (error) {
      console.error('[Phase2Checkpoint] Exception fetching checkpoints:', error);
      return [];
    }
  }
  
  static async approveCheckpoint(
    checkpointId: string,
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get checkpoint details
      const { data: checkpoint, error: fetchError } = await supabase
        .from('phase2_checkpoints')
        .select('*')
        .eq('id', checkpointId)
        .single();
      
      if (fetchError || !checkpoint) {
        return { success: false, error: 'Checkpoint not found' };
      }
      
      // Update checkpoint status
      const { error: updateError } = await supabase
        .from('phase2_checkpoints')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkpointId);
      
      if (updateError) {
        console.error('[Phase2Checkpoint] Error approving checkpoint:', updateError);
        return { success: false, error: updateError.message };
      }
      
      // Create transaction record for checkpoint approval (bonus will be added when user submits)
      await this.createTransaction({
        user_id: checkpoint.auth_user_id,
        type: 'phase2_checkpoint_approved',
        amount: 0,
        description: `Phase 2 checkpoint approved at task ${checkpoint.task_number}. User must submit product to receive bonus.`,
        status: 'completed',
        metadata: { checkpoint_id: checkpointId, admin_id: adminId, pending_bonus: checkpoint.bonus_amount }
      });
      
      // Send notification to training user about checkpoint approval (non-blocking)
      TelegramService.sendCheckpointApprovedNotification(
        checkpoint.email,
        checkpoint.task_number,
        checkpoint.bonus_amount
      ).catch(err => {
        console.error('[Phase2Checkpoint] Failed to send checkpoint approval notification:', err);
      });
      
      console.log('[Phase2Checkpoint] Approved checkpoint', checkpointId, 'Waiting for user to submit product. Bonus:', checkpoint.bonus_amount);
      return { success: true };
    } catch (error) {
      console.error('[Phase2Checkpoint] Exception approving checkpoint:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static async rejectCheckpoint(
    checkpointId: string,
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('phase2_checkpoints')
        .update({
          status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkpointId);
      
      if (error) {
        console.error('[Phase2Checkpoint] Error rejecting checkpoint:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[Phase2Checkpoint] Rejected checkpoint', checkpointId);
      return { success: true };
    } catch (error) {
      console.error('[Phase2Checkpoint] Exception rejecting checkpoint:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static async submitCheckpointProduct(
    authUserId: string,
    checkpointId: string,
    checkpointData?: any
  ): Promise<{ success: boolean; bonusAmount?: number; oldBalance?: number; newBalance?: number; nextTaskNumber?: number; error?: string }> {
    console.log('[Checkpoint Submit] === STARTING SUBMISSION ===');
    console.log('[Checkpoint Submit] authUserId:', authUserId);
    console.log('[Checkpoint Submit] checkpointId:', checkpointId);
    console.log('[Checkpoint Submit] checkpointData provided:', !!checkpointData);

    let checkpoint = checkpointData;

    // If checkpoint data not provided, fetch it with timeout
    if (!checkpoint) {
      console.log('[Checkpoint Submit] Checkpoint data not provided, fetching from database with timeout...');
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Checkpoint fetch timeout (10s)')), 10000)
        );

        const fetchPromise = supabase
          .from('phase2_checkpoints')
          .select('*')
          .eq('id', checkpointId)
          .eq('auth_user_id', authUserId)
          .maybeSingle();

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (result.error) {
          console.error('[Checkpoint Submit] ERROR fetching checkpoint:', result.error);
          return { success: false, error: 'Checkpoint not found: ' + result.error.message };
        }

        if (!result.data) {
          console.error('[Checkpoint Submit] ERROR: No checkpoint data returned');
          return { success: false, error: 'Checkpoint not found - no data returned' };
        }

        checkpoint = result.data;
        console.log('[Checkpoint Submit] Checkpoint fetched successfully:', checkpoint.id);
      } catch (error) {
        console.error('[Checkpoint Submit] EXCEPTION during checkpoint fetch:', error);
        return { success: false, error: 'Checkpoint fetch failed: ' + (error instanceof Error ? error.message : 'Unknown error') };
      }
    } else {
      console.log('[Checkpoint Submit] Using provided checkpoint data:', checkpoint.id);
    }

    console.log('[Checkpoint Submit] checkpoint found:', checkpoint.id);
    console.log('[Checkpoint Submit] checkpoint status:', checkpoint.status);
    console.log('[Checkpoint Submit] checkpoint bonus_amount:', checkpoint.bonus_amount);

    // Prevent duplicate bonus payment - check if already processed
    if (checkpoint.status === 'completed' || checkpoint.status === 'bonus_paid' || checkpoint.status === 'submitted') {
      console.log('[Checkpoint Submit] [STEP 1] Checkpoint already processed. Status:', checkpoint.status);
      console.log('[Checkpoint Submit] [STEP 1] Returning success without adding bonus again');
      // Return success so frontend can proceed, but don't add bonus again
      // Get current task number for response
      const { data: trainingAccount } = await supabase
        .from('training_accounts')
        .select('task_number')
        .eq('auth_user_id', authUserId)
        .single();
      return {
        success: true,
        bonusAmount: 0,
        nextTaskNumber: trainingAccount?.task_number || checkpoint.task_number + 1
      };
    }

    if (checkpoint.status !== 'approved') {
      console.error('[Checkpoint Submit] [STEP 1] ERROR: Checkpoint not approved. Status:', checkpoint.status);
      return { success: false, error: 'Checkpoint must be approved before submitting' };
    }

    // STEP 2: Fetch training account
    console.log('[Checkpoint Submit] [STEP 2] BEFORE fetching training account');
    const { data: trainingAccount, error: trainingError } = await supabase
      .from('training_accounts')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    console.log('[Checkpoint Submit] [STEP 2] AFTER fetching training account');

    if (trainingError) {
      console.error('[Checkpoint Submit] [STEP 2] ERROR fetching training account:', trainingError);
      return { success: false, error: 'Training account error: ' + trainingError.message };
    }

    if (!trainingAccount) {
      console.error('[Checkpoint Submit] [STEP 2] ERROR: No training account found');
      return { success: false, error: 'Training account not found' };
    }

    // RECOVERY: Check if bonus was already paid (from previous failed attempt)
    // This handles the case where balance was updated but checkpoint status wasn't
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', authUserId)
      .eq('type', 'phase2_checkpoint_bonus')
      .eq('metadata->>checkpoint_id', checkpointId)
      .maybeSingle();

    if (existingTransaction) {
      console.log('[Checkpoint Submit] [RECOVERY] Found existing bonus transaction:', existingTransaction.id);
      console.log('[Checkpoint Submit] [RECOVERY] Bonus was already paid, just need to complete checkpoint');

      // Just update checkpoint status to completed (no bonus added this time)
      const { error: updateError } = await supabase
        .from('phase2_checkpoints')
        .update({ status: 'completed' })
        .eq('id', checkpointId);

      if (updateError) {
        console.error('[Checkpoint Submit] [RECOVERY] Failed to update checkpoint:', updateError);
        return { success: false, error: 'Failed to complete checkpoint. Please refresh and try again.' };
      }

      // Also advance task_number if it hasn't been advanced yet
      const expectedNextTask = checkpoint.task_number + 1;
      let finalTaskNumber = trainingAccount.task_number;

      if (trainingAccount.task_number < expectedNextTask) {
        console.log('[Checkpoint Submit] [RECOVERY] Advancing task_number from', trainingAccount.task_number, 'to', expectedNextTask);
        const { error: taskUpdateError } = await supabase
          .from('training_accounts')
          .update({ task_number: expectedNextTask })
          .eq('auth_user_id', authUserId);

        if (!taskUpdateError) {
          finalTaskNumber = expectedNextTask;
        }
      }

      console.log('[Checkpoint Submit] [RECOVERY] Checkpoint marked as completed');
      return {
        success: true,
        bonusAmount: 0,
        nextTaskNumber: finalTaskNumber
      };
    }

    console.log('[Checkpoint Submit] [STEP 2] training account found');
    console.log('[Checkpoint Submit] [STEP 2] current amount:', trainingAccount.amount);
    console.log('[Checkpoint Submit] [STEP 2] current task_number:', trainingAccount.task_number);

    // Calculate values
    const bonusAmount = checkpoint.bonus_amount || 0;
    const oldBalance = trainingAccount.amount || 0;
    const newBalance = oldBalance + bonusAmount;
    const currentTaskNumber = trainingAccount.task_number || 1;
    const nextTaskNumber = currentTaskNumber + 1;

    console.log('[Checkpoint Submit] calculated values:');
    console.log('[Checkpoint Submit]   old balance:', oldBalance);
    console.log('[Checkpoint Submit]   bonus amount:', bonusAmount);
    console.log('[Checkpoint Submit]   new balance:', newBalance);
    console.log('[Checkpoint Submit]   current task:', currentTaskNumber);
    console.log('[Checkpoint Submit]   next task:', nextTaskNumber);

    // STEP 3: Update training account (balance + task_number)
    console.log('[Checkpoint Submit] [STEP 3] BEFORE updating training account');
    const updatePayload = {
      amount: newBalance,
      task_number: nextTaskNumber
    };
    console.log('[Checkpoint Submit] [STEP 3] Full update payload:', JSON.stringify(updatePayload, null, 2));
    console.log('[Checkpoint Submit] [STEP 3] Filter: auth_user_id =', authUserId);
    const { data: updatedAccount, error: amountError } = await supabase
      .from('training_accounts')
      .update(updatePayload)
      .eq('auth_user_id', authUserId)
      .select();
    console.log('[Checkpoint Submit] [STEP 3] AFTER updating training account');

    if (amountError) {
      console.error('[Checkpoint Submit] [STEP 3] ERROR updating training account:', amountError);
      return { success: false, error: 'Failed to update balance: ' + amountError.message };
    }

    console.log('[Checkpoint Submit] [STEP 3] training account updated successfully');
    console.log('[Checkpoint Submit] [STEP 3] updated data:', updatedAccount);

    // STEP 4: Update checkpoint to completed (CRITICAL - must succeed)
    // Only update status column which definitely exists in the table
    // Do NOT use completed_at or updated_at as they may not exist
    console.log('[Checkpoint Submit] [STEP 4] BEFORE updating checkpoint status');
    const { data: updatedCheckpoint, error: updateError } = await supabase
      .from('phase2_checkpoints')
      .update({
        status: 'completed'
      })
      .eq('id', checkpointId)
      .select();
    console.log('[Checkpoint Submit] [STEP 4] AFTER updating checkpoint status');

    if (updateError) {
      console.error('[Checkpoint Submit] [STEP 4] ERROR updating checkpoint:', updateError);
      // CRITICAL: If checkpoint update fails, we must return error to prevent duplicate bonus
      // The balance was already updated in STEP 3, so we can't easily rollback
      // But we must tell the frontend it failed so user can retry
      return {
        success: false,
        error: 'Checkpoint status update failed. Please refresh and try again. If this persists, contact support.'
      };
    }

    console.log('[Checkpoint Submit] [STEP 4] checkpoint updated to completed');
    console.log('[Checkpoint Submit] [STEP 4] updated data:', updatedCheckpoint);

    // STEP 5: Create transaction record
    console.log('[Checkpoint Submit] [STEP 5] BEFORE creating transaction');
    try {
      const transactionResult = await this.createTransaction({
        user_id: authUserId,
        type: 'phase2_checkpoint_bonus',
        amount: bonusAmount,
        description: '6x premium checkpoint bonus',
        status: 'completed',
        metadata: {
          checkpoint_id: checkpointId,
          old_amount: oldBalance,
          new_amount: newBalance,
          bonus_amount: bonusAmount,
          old_task: currentTaskNumber,
          new_task: nextTaskNumber
        }
      });
      console.log('[Checkpoint Submit] [STEP 5] AFTER creating transaction:', transactionResult);
    } catch (transactionError) {
      console.error('[Checkpoint Submit] [STEP 5] ERROR creating transaction:', transactionError);
      // Don't fail the whole operation if transaction fails
    }

    console.log('[Checkpoint Submit] === SUBMISSION COMPLETED SUCCESSFULLY ===');
    console.log('[Checkpoint Submit] Returning:', { success: true, bonusAmount, oldBalance, newBalance, nextTaskNumber });

    return { success: true, bonusAmount, oldBalance, newBalance, nextTaskNumber };
  } catch (error) {
    console.error('[Checkpoint Submit] === UNEXPECTED EXCEPTION ===');
    console.error('[Checkpoint Submit] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }

  // Update checkpoint status (for recovery purposes)
  static async updateCheckpointStatus(
    checkpointId: string,
    status: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('phase2_checkpoints')
        .update({ status })
        .eq('id', checkpointId);
      
      if (error) {
        console.error('[updateCheckpointStatus] Error:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[updateCheckpointStatus] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // ===========================================
  // PERSONAL DAY 2 CHECKPOINT OPERATIONS
  // ===========================================
  
  static async createPersonalDay2Checkpoint(
    authUserId: string,
    email: string,
    taskNumber: number,
    product1: { name: string; image: string; price: number },
    product2: { name: string; image: string; price: number },
    bonusAmount: number = 186.00 // 6X of ~$31 combination value
  ): Promise<PersonalDay2Checkpoint | null> {
    try {
      // Check if checkpoint already exists for this user in cycle 2
      const { data: existing } = await supabase
        .from('personal_day2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('cycle', 2)
        .in('status', ['pending', 'pending_review', 'approved', 'completed', 'submitted', 'bonus_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        console.log('[PersonalDay2Checkpoint] Checkpoint already exists:', existing.id, 'status:', existing.status);
        return existing as PersonalDay2Checkpoint;
      }
      
      // Calculate combination value
      const combinationValue = product1.price + product2.price;
      
      console.log('[PersonalDay2Checkpoint] Creating checkpoint for task', taskNumber, 'user:', email);
      console.log('[PersonalDay2Checkpoint] Product 1:', product1.name, '$' + product1.price);
      console.log('[PersonalDay2Checkpoint] Product 2:', product2.name, '$' + product2.price);
      console.log('[PersonalDay2Checkpoint] Combination value:', combinationValue);
      console.log('[PersonalDay2Checkpoint] Bonus amount (6X):', bonusAmount);
      
      const { data, error } = await supabase
        .from('personal_day2_checkpoints')
        .insert({
          user_id: authUserId,
          auth_user_id: authUserId,
          email,
          cycle: 2,
          task_number: taskNumber,
          status: 'pending_review',
          product1_name: product1.name,
          product1_image: product1.image,
          product1_price: product1.price,
          product2_name: product2.name,
          product2_image: product2.image,
          product2_price: product2.price,
          combination_value: combinationValue,
          bonus_amount: bonusAmount,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('[PersonalDay2Checkpoint] Error creating checkpoint:', error);
        return null;
      }
      
      console.log('[PersonalDay2Checkpoint] Created checkpoint for task', taskNumber, 'user:', email);
      return data as PersonalDay2Checkpoint;
    } catch (error) {
      console.error('[PersonalDay2Checkpoint] Exception creating checkpoint:', error);
      return null;
    }
  }
  
  static async getUserPendingPersonalDay2Checkpoint(authUserId: string): Promise<PersonalDay2Checkpoint | null> {
    try {
      console.log('[PersonalDay2Checkpoint] Fetching pending checkpoint for user:', authUserId);
      
      const { data, error } = await supabase
        .from('personal_day2_checkpoints')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('cycle', 2)
        .eq('status', 'pending_review')
        .maybeSingle();
      
      if (error) {
        console.error('[PersonalDay2Checkpoint] Error fetching checkpoint:', error);
        return null;
      }
      
      if (data) {
        console.log('[PersonalDay2Checkpoint] Found pending checkpoint:', data.id, 'at task', data.task_number);
      } else {
        console.log('[PersonalDay2Checkpoint] No pending checkpoint found');
      }
      
      return data as PersonalDay2Checkpoint | null;
    } catch (error) {
      console.error('[PersonalDay2Checkpoint] Exception fetching checkpoint:', error);
      return null;
    }
  }
  
  static async getAllPendingPersonalDay2Checkpoints(): Promise<PersonalDay2Checkpoint[]> {
    try {
      const { data, error } = await supabase
        .from('personal_day2_checkpoints')
        .select('*')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[PersonalDay2Checkpoint] Error fetching checkpoints:', error);
        return [];
      }
      
      return data as PersonalDay2Checkpoint[];
    } catch (error) {
      console.error('[PersonalDay2Checkpoint] Exception fetching checkpoints:', error);
      return [];
    }
  }
  
  static async approvePersonalDay2Checkpoint(
    checkpointId: string,
    adminId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get checkpoint details
      const { data: checkpoint, error: fetchError } = await supabase
        .from('personal_day2_checkpoints')
        .select('*')
        .eq('id', checkpointId)
        .single();
      
      if (fetchError || !checkpoint) {
        return { success: false, error: 'Checkpoint not found' };
      }
      
      // Update checkpoint status
      const { error: updateError } = await supabase
        .from('personal_day2_checkpoints')
        .update({
          status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', checkpointId);
      
      if (updateError) {
        console.error('[PersonalDay2Checkpoint] Error approving checkpoint:', updateError);
        return { success: false, error: updateError.message };
      }
      
      // Update user's personal_day2_checkpoint field
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          personal_day2_checkpoint: jsonb_build_object(
            'status', 'approved',
            'triggered_at', (checkpoint.created_at),
            'cleared_at', null,
            'multiplier_applied', false,
            'task_number', checkpoint.task_number,
            'id', checkpoint.id,
            'approved_at', NOW()
          )
        })
        .eq('id', checkpoint.auth_user_id);
      
      if (userUpdateError) {
        console.error('[PersonalDay2Checkpoint] Error updating user checkpoint status:', userUpdateError);
      }
      
      // Create transaction record for checkpoint approval
      await this.createTransaction({
        user_id: checkpoint.auth_user_id,
        type: 'personal_day2_checkpoint_approved',
        amount: 0,
        description: `Personal Day 2 checkpoint approved at task ${checkpoint.task_number}. User must submit product to receive 6x bonus.`,
        status: 'completed',
        metadata: { checkpoint_id: checkpointId, admin_id: adminId, pending_bonus: checkpoint.bonus_amount }
      });
      
      console.log('[PersonalDay2Checkpoint] Approved checkpoint', checkpointId, 'Bonus:', checkpoint.bonus_amount);
      return { success: true };
    } catch (error) {
      console.error('[PersonalDay2Checkpoint] Exception approving checkpoint:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  static async submitPersonalDay2CheckpointProduct(
    authUserId: string,
    checkpointId: string,
    checkpointData?: any
  ): Promise<{ success: boolean; bonusAmount?: number; oldBalance?: number; newBalance?: number; nextTaskNumber?: number; error?: string }> {
    console.log('[PersonalDay2Checkpoint Submit] === STARTING SUBMISSION ===');
    console.log('[PersonalDay2Checkpoint Submit] authUserId:', authUserId);
    console.log('[PersonalDay2Checkpoint Submit] checkpointId:', checkpointId);

    let checkpoint = checkpointData;

    // If checkpoint data not provided, fetch it
    if (!checkpoint) {
      console.log('[PersonalDay2Checkpoint Submit] Fetching checkpoint from database...');
      try {
        const { data: checkpointResult, error: fetchError } = await supabase
          .from('personal_day2_checkpoints')
          .select('*')
          .eq('id', checkpointId)
          .eq('auth_user_id', authUserId)
          .maybeSingle();

        if (fetchError || !checkpointResult) {
          console.error('[PersonalDay2Checkpoint Submit] ERROR fetching checkpoint:', fetchError);
          return { success: false, error: 'Checkpoint not found' };
        }

        checkpoint = checkpointResult;
        console.log('[PersonalDay2Checkpoint Submit] Checkpoint fetched successfully:', checkpoint.id);
      } catch (error) {
        console.error('[PersonalDay2Checkpoint Submit] EXCEPTION during checkpoint fetch:', error);
        return { success: false, error: 'Checkpoint fetch failed' };
      }
    }

    console.log('[PersonalDay2Checkpoint Submit] checkpoint status:', checkpoint.status);
    console.log('[PersonalDay2Checkpoint Submit] checkpoint bonus_amount:', checkpoint.bonus_amount);

    // Prevent duplicate bonus payment
    if (checkpoint.status === 'completed' || checkpoint.status === 'bonus_paid' || checkpoint.status === 'submitted' || checkpoint.status === 'pending') {
      console.log('[PersonalDay2Checkpoint Submit] Checkpoint already processed. Status:', checkpoint.status);
      return { success: true, bonusAmount: 0, nextTaskNumber: checkpoint.task_number + 1 };
    }

    if (checkpoint.status !== 'approved' && checkpoint.status !== 'pending_review') {
      console.error('[PersonalDay2Checkpoint Submit] ERROR: Checkpoint not approved. Status:', checkpoint.status);
      return { success: false, error: 'Checkpoint must be approved before submitting' };
    }

    // Get current user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, tasks_completed')
      .eq('id', authUserId)
      .single();

    if (userError || !user) {
      console.error('[PersonalDay2Checkpoint Submit] ERROR fetching user:', userError);
      return { success: false, error: 'User not found' };
    }

    // Calculate values
    const bonusAmount = checkpoint.bonus_amount || 186.00;
    const oldBalance = user.balance || 0;
    const newBalance = oldBalance + bonusAmount;
    const currentTaskNumber = user.tasks_completed || 1;
    const nextTaskNumber = currentTaskNumber + 1;

    console.log('[PersonalDay2Checkpoint Submit] calculated values:');
    console.log('[PersonalDay2Checkpoint Submit]   old balance:', oldBalance);
    console.log('[PersonalDay2Checkpoint Submit]   bonus amount:', bonusAmount);
    console.log('[PersonalDay2Checkpoint Submit]   new balance:', newBalance);
    console.log('[PersonalDay2Checkpoint Submit]   current task:', currentTaskNumber);
    console.log('[PersonalDay2Checkpoint Submit]   next task:', nextTaskNumber);

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        tasks_completed: nextTaskNumber,
        personal_day2_checkpoint: jsonb_build_object(
          'status', 'completed',
          'triggered_at', checkpoint.created_at,
          'cleared_at', NOW(),
          'multiplier_applied', true,
          'task_number', checkpoint.task_number,
          'id', checkpoint.id
        ),
        is_negative_balance: false
      })
      .eq('id', authUserId);

    if (updateError) {
      console.error('[PersonalDay2Checkpoint Submit] ERROR updating user:', updateError);
      return { success: false, error: 'Failed to update balance' };
    }

    // Update checkpoint status to completed
    const { error: checkpointUpdateError } = await supabase
      .from('personal_day2_checkpoints')
      .update({ 
        status: 'completed',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', checkpointId);

    if (checkpointUpdateError) {
      console.error('[PersonalDay2Checkpoint Submit] ERROR updating checkpoint:', checkpointUpdateError);
      return { success: false, error: 'Failed to complete checkpoint' };
    }

    // Create transaction record
    try {
      await this.createTransaction({
        user_id: authUserId,
        type: 'personal_day2_checkpoint_bonus',
        amount: bonusAmount,
        description: '6x premium checkpoint bonus (Personal Day 2)',
        status: 'completed',
        metadata: {
          checkpoint_id: checkpointId,
          old_amount: oldBalance,
          new_amount: newBalance,
          bonus_amount: bonusAmount,
          old_task: currentTaskNumber,
          new_task: nextTaskNumber
        }
      });
    } catch (transactionError) {
      console.error('[PersonalDay2Checkpoint Submit] ERROR creating transaction:', transactionError);
    }

    console.log('[PersonalDay2Checkpoint Submit] === SUBMISSION COMPLETED SUCCESSFULLY ===');
    console.log('[PersonalDay2Checkpoint Submit] Returning:', { success: true, bonusAmount, oldBalance, newBalance, nextTaskNumber });

    return { success: true, bonusAmount, oldBalance, newBalance, nextTaskNumber };
  }
  
  // ===========================================
  // TRAINING COMPLETION TRANSFER (2% to personal account)
  // ===========================================
  
  static async processTrainingCompletionTransfer(
    trainingAuthUserId: string
  ): Promise<{ success: boolean; transferAmount?: number; error?: string }> {
    try {
      console.log('[TrainingCompletion] Processing completion transfer for:', trainingAuthUserId);
      
      // Get training account details
      const { data: trainingAccount, error: trainingError } = await supabase
        .from('training_accounts')
        .select('*')
        .eq('auth_user_id', trainingAuthUserId)
        .single();
      
      if (trainingError || !trainingAccount) {
        console.error('[TrainingCompletion] Training account not found:', trainingError);
        return { success: false, error: 'Training account not found' };
      }
      
      // Verify completion criteria
      const isPhase1Complete = trainingAccount.task_number > 45; // Phase 1 has 45 tasks
      const isPhase2Complete = trainingAccount.completed === true; // completed flag for Phase 2
      const currentBalance = trainingAccount.amount || 0;
      const TARGET_BALANCE = 2423.30;
      
      console.log('[TrainingCompletion] Status:', {
        phase1: isPhase1Complete,
        phase2: isPhase2Complete,
        balance: currentBalance,
        target: TARGET_BALANCE
      });
      
      // Check if both phases are complete
      if (!isPhase1Complete || !isPhase2Complete) {
        return { success: false, error: 'Both Phase 1 and Phase 2 must be completed' };
      }
      
      // Check if balance is at target (allow small floating point tolerance)
      if (Math.abs(currentBalance - TARGET_BALANCE) > 0.01) {
        return { success: false, error: `Balance must be $${TARGET_BALANCE.toFixed(2)} before transfer. Current: $${currentBalance.toFixed(2)}` };
      }
      
      // Calculate 2% transfer amount = $48.62
      const TRANSFER_PERCENTAGE = 0.02;
      const transferAmount = Math.round(TARGET_BALANCE * TRANSFER_PERCENTAGE * 100) / 100; // $48.62
      const remainingBalance = TARGET_BALANCE - transferAmount; // $2382.58
      
      console.log('[TrainingCompletion] Calculated transfer:', {
        transferAmount,
        remainingBalance
      });
      
      // Find linked personal account using referral_code
      // The training account stores the linked user's ID in referred_by field
      const linkedUserId = trainingAccount.referred_by;
      
      if (!linkedUserId) {
        console.error('[TrainingCompletion] No linked personal account found. Training account has no referred_by value.');
        return { success: false, error: 'No linked personal account found for this training account' };
      }
      
      // Get linked personal account
      const { data: personalAccount, error: personalError } = await supabase
        .from('users')
        .select('*')
        .eq('id', linkedUserId)
        .single();
      
      if (personalError || !personalAccount) {
        console.error('[TrainingCompletion] Linked personal account not found:', personalError);
        return { success: false, error: 'Linked personal account not found' };
      }
      
      console.log('[TrainingCompletion] Found linked personal account:', personalAccount.id, personalAccount.email);
      
      // Perform the transfer - Update training account balance (deduct transfer amount)
      const { error: trainingUpdateError } = await supabase
        .from('training_accounts')
        .update({
          amount: remainingBalance,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', trainingAuthUserId);
      
      if (trainingUpdateError) {
        console.error('[TrainingCompletion] Error updating training account:', trainingUpdateError);
        return { success: false, error: trainingUpdateError.message };
      }
      
      // Add transfer amount to personal account balance
      const currentPersonalBalance = personalAccount.balance || 0;
      const newPersonalBalance = currentPersonalBalance + transferAmount;
      
      const { error: personalUpdateError } = await supabase
        .from('users')
        .update({
          balance: newPersonalBalance,
          total_earned: (personalAccount.total_earned || 0) + transferAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', linkedUserId);
      
      if (personalUpdateError) {
        console.error('[TrainingCompletion] Error updating personal account:', personalUpdateError);
        return { success: false, error: personalUpdateError.message };
      }
      
      // Create transaction record for the transfer
      await this.createTransaction({
        user_id: trainingAuthUserId,
        type: 'training_completion_transfer_out',
        amount: -transferAmount,
        description: `Training completion: 2% transfer ($${transferAmount.toFixed(2)}) to linked personal account`,
        status: 'completed',
        metadata: {
          training_account_id: trainingAuthUserId,
          personal_account_id: linkedUserId,
          personal_email: personalAccount.email,
          transfer_amount: transferAmount,
          old_training_balance: TARGET_BALANCE,
          new_training_balance: remainingBalance,
          old_personal_balance: currentPersonalBalance,
          new_personal_balance: newPersonalBalance
        }
      });
      
      // Create transaction record for personal account receiving the transfer
      await this.createTransaction({
        user_id: linkedUserId,
        type: 'training_completion_transfer_in',
        amount: transferAmount,
        description: `Received $${transferAmount.toFixed(2)} from training account completion (2% of $${TARGET_BALANCE.toFixed(2)})`,
        status: 'completed',
        metadata: {
          training_account_id: trainingAuthUserId,
          training_email: trainingAccount.email,
          transfer_amount: transferAmount
        }
      });
      
      console.log('[TrainingCompletion] Transfer completed successfully:', {
        transferAmount,
        trainingBalance: remainingBalance,
        personalBalance: newPersonalBalance,
        linkedAccount: personalAccount.email
      });
      
      return { success: true, transferAmount };
    } catch (error) {
      console.error('[TrainingCompletion] Exception processing transfer:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===========================================
  // TRAINING SETTINGS (Admin-configurable)
  // ===========================================

  static async getTrainingSettings(): Promise<{
    checkpoint_multiplier: number;
    training_completion_percentage: number;
    phase2_target_final_balance: number;
    checkpoint_bonus_mode: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('training_settings')
        .select('*')
        .eq('id', 'default')
        .single();
      
      if (error) {
        console.log('[TrainingSettings] No settings found, returning defaults');
        return {
          checkpoint_multiplier: 6,
          training_completion_percentage: 2,
          phase2_target_final_balance: 2423.30,
          checkpoint_bonus_mode: 'dynamic'
        };
      }
      
      return {
        checkpoint_multiplier: data.checkpoint_multiplier ?? 6,
        training_completion_percentage: data.training_completion_percentage ?? 2,
        phase2_target_final_balance: data.phase2_target_final_balance ?? 2423.30,
        checkpoint_bonus_mode: data.checkpoint_bonus_mode ?? 'dynamic'
      };
    } catch (error) {
      console.error('[TrainingSettings] Error fetching settings:', error);
      return {
        checkpoint_multiplier: 6,
        training_completion_percentage: 2,
        phase2_target_final_balance: 2423.30,
        checkpoint_bonus_mode: 'dynamic'
      };
    }
  }

  static async updateTrainingSettings(settings: {
    checkpoint_multiplier?: number;
    training_completion_percentage?: number;
    phase2_target_final_balance?: number;
    checkpoint_bonus_mode?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('training_settings')
        .upsert({
          id: 'default',
          ...settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('[TrainingSettings] Error updating settings:', error);
        return { success: false, error: error.message };
      }
      
      console.log('[TrainingSettings] Settings updated successfully:', settings);
      return { success: true };
    } catch (error) {
      console.error('[TrainingSettings] Exception updating settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===========================================
  // CHAT ATTACHMENTS - File Upload/Download
  // ===========================================

  static async uploadChatAttachment(
    file: File,
    userId: string
  ): Promise<{ 
    success: boolean; 
    url?: string; 
    path?: string;
    error?: string;
    attachmentType?: string;
    attachmentName?: string;
    attachmentSize?: number;
  }> {
    try {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return { 
          success: false, 
          error: 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP, PDF' 
        };
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        return { 
          success: false, 
          error: 'File too large. Maximum size is 10MB' 
        };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${userId}/${timestamp}-${randomString}-${sanitizedName}`;

      console.log('[ChatAttachment] Uploading file:', filePath, 'Type:', file.type, 'Size:', file.size);

      // Upload to Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('[ChatAttachment] Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      console.log('[ChatAttachment] Upload successful:', publicUrl);

      return {
        success: true,
        url: publicUrl,
        path: filePath,
        attachmentType: file.type,
        attachmentName: file.name,
        attachmentSize: file.size
      };
    } catch (error) {
      console.error('[ChatAttachment] Exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  }

  static async deleteChatAttachment(
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .storage
        .from('chat-attachments')
        .remove([filePath]);

      if (error) {
        console.error('[ChatAttachment] Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('[ChatAttachment] Delete exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  }

  static isImageAttachment(type: string): boolean {
    return type.startsWith('image/');
  }

  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ===========================================
  // PHASE 1 RESET (ADMIN)
  // ===========================================
  
  static async resetPhase1ForUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Reset Phase 1 lock and move to Phase 2
      const { error } = await supabase
        .from('users')
        .update({
          training_phase_1_locked: false,
          training_phase_1_locked_at: null,
          training_phase: 2,
          tasks_completed: 0,
          training_progress: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('[resetPhase1ForUser] Error:', error);
        return { success: false, error: error.message };
      }

      // Delete existing tasks and create new Phase 2 tasks
      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);

      // Create 45 new tasks for Phase 2
      await this.createTrainingTasks(userId, 45);

      console.log('[resetPhase1ForUser] Phase 1 reset successful for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('[resetPhase1ForUser] Exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Phase 1 reset failed' 
      };
    }
  }

  // ===========================================
  // PHASE 2 CHECKPOINT CLEARING (ADMIN)
  // ===========================================
  
  static async clearPhase2Checkpoint(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { success: false, error: 'User not found' };
      }

      // Clear the checkpoint - this will trigger the 6x multiplier via database trigger
      const { error } = await supabase
        .from('users')
        .update({
          training_phase_2_checkpoint: jsonb_build_object(
            'status', 'cleared',
            'triggered_at', user.training_phase_2_checkpoint?.triggered_at,
            'cleared_at', NOW(),
            'multiplier_applied', false
          ),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('[clearPhase2Checkpoint] Error:', error);
        return { success: false, error: error.message };
      }

      console.log('[clearPhase2Checkpoint] Phase 2 checkpoint cleared for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('[clearPhase2Checkpoint] Exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Phase 2 checkpoint clearing failed' 
      };
    }
  }

  // ===========================================
  // EMERGENCY COMMISSION TRANSFER
  // ===========================================

  static async executeEmergencyTransfer(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[EmergencyTransfer] Starting emergency commission transfer...');

      // Find personal account (fire@gmail.com)
      const { data: personalUser, error: personalError } = await supabase
        .from('users')
        .select('id, email, balance, total_earned')
        .eq('email', 'fire@gmail.com')
        .eq('account_type', 'personal')
        .single();

      if (personalError || !personalUser) {
        console.error('[EmergencyTransfer] Personal account not found:', personalError);
        return { success: false, error: 'Personal account not found' };
      }

      console.log('[EmergencyTransfer] Personal account found:', personalUser.email, 'current balance:', personalUser.balance);

      // Find training account (water@gmail.com)
      const { data: trainingUser, error: trainingError } = await supabase
        .from('users')
        .select('id, email, balance')
        .eq('email', 'water@gmail.com')
        .eq('account_type', 'training')
        .single();

      if (trainingError || !trainingUser) {
        console.error('[EmergencyTransfer] Training account not found:', trainingError);
        return { success: false, error: 'Training account not found' };
      }

      console.log('[EmergencyTransfer] Training account found:', trainingUser.email, 'current balance:', trainingUser.balance);

      const trainingBalance = trainingUser.balance;
      const commissionAmount = Math.round(trainingBalance * 0.02 * 100) / 100; // Exact 2% rounded to 2 decimals
      const remainingTrainingBalance = trainingBalance - commissionAmount;

      console.log('[EmergencyTransfer] Calculated commission:', commissionAmount);
      console.log('[EmergencyTransfer] Remaining training balance:', remainingTrainingBalance);

      // Update personal account balance to commission amount only
      const { error: personalUpdateError } = await supabase
        .from('users')
        .update({
          balance: commissionAmount,
          total_earned: commissionAmount,
          user_status: 'active',
          training_completed: true,
          commission_transferred: true,
          commission_transfer_amount: commissionAmount,
          commission_transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', personalUser.id);

      if (personalUpdateError) {
        console.error('[EmergencyTransfer] Error updating personal account:', personalUpdateError);
        return { success: false, error: personalUpdateError.message };
      }

      console.log('[EmergencyTransfer] Personal account updated successfully');

      // Update training account balance (deduct commission)
      const { error: trainingUpdateError } = await supabase
        .from('users')
        .update({
          balance: remainingTrainingBalance,
          commission_transferred: true,
          commission_transfer_amount: commissionAmount,
          commission_transferred_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingUser.id);

      if (trainingUpdateError) {
        console.error('[EmergencyTransfer] Error updating training account:', trainingUpdateError);
        return { success: false, error: trainingUpdateError.message };
      }

      console.log('[EmergencyTransfer] Training account updated successfully');

      console.log('[EmergencyTransfer] Commission transfer completed successfully!');
      console.log('[EmergencyTransfer] Final balances:');
      console.log('[EmergencyTransfer] - Personal (fire@gmail.com):', commissionAmount.toFixed(2));
      console.log('[EmergencyTransfer] - Training (water@gmail.com):', remainingTrainingBalance.toFixed(2));

      return { success: true };
    } catch (error) {
      console.error('[EmergencyTransfer] Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // ===========================================
  // COMMISSION TRANSFER CHECK (ON LOGIN)
  // ===========================================
  
  static async checkAndTransferCommission(userId: string): Promise<{ success: boolean; transferred?: boolean; amount?: number; error?: string }> {
    try {
      console.log('[Transfer] checkAndTransferCommission started for userId:', userId);
      
      // Get user data
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.log('[Transfer] User not found:', userError);
        return { success: false, error: 'User not found' };
      }

      console.log('[Transfer] User found:', { id: user.id, email: user.email, account_type: user.account_type, referral_code: user.referral_code });

      // Only check for personal accounts (VIP1)
      if (user.account_type !== 'personal') {
        console.log('[Transfer] Not a personal account, skipping transfer');
        return { success: true, transferred: false };
      }

      // Check if user has any completed training accounts linked via their referral code
      console.log('[Transfer] Querying for training accounts with referred_by =', user.referral_code);
      const { data: trainingAccounts, error: trainingError } = await supabase
        .from('users')
        .select('*')
        .eq('referred_by', user.referral_code)
        .eq('account_type', 'training')
        .eq('training_completed_v2', true)
        .eq('commission_transferred', false);

      if (trainingError) {
        console.error('[checkAndTransferCommission] Error fetching training accounts:', trainingError);
        return { success: false, error: trainingError.message };
      }

      console.log('[Transfer] linked training found:', trainingAccounts?.length || 0, 'accounts');

      // Debug: Check if there are ANY training accounts linked by referral code (regardless of completion)
      if (!trainingAccounts || trainingAccounts.length === 0) {
        console.log('[Transfer] No completed training accounts found. Checking for ANY linked training accounts...');
        const { data: allTrainingAccounts, error: allError } = await supabase
          .from('users')
          .select('id, email, referred_by, training_completed_v2, commission_transferred, balance')
          .eq('referred_by', user.referral_code)
          .eq('account_type', 'training');

        if (!allError) {
          console.log('[Transfer] All linked training accounts (any status):', allTrainingAccounts?.length || 0);
          console.log('[Transfer] Training accounts details:', allTrainingAccounts);
        }
      }

      if (!trainingAccounts || trainingAccounts.length === 0) {
        console.log('[Transfer] No completed training accounts with pending transfers');
        return { success: true, transferred: false };
      }

      // Process each completed training account
      let totalTransferred = 0;
      let personalAccountActivated = false;
      
      for (const trainingAccount of trainingAccounts) {
        const result = await this.processSingleTrainingTransfer(user, trainingAccount);
        if (result.success) {
          totalTransferred += result.amount || 0;
        }
      }

      console.log('[Transfer] transfer execution completed - total transferred:', totalTransferred, 'to user:', userId);
      return { success: true, transferred: totalTransferred > 0, amount: totalTransferred };
    } catch (error) {
      console.error('[checkAndTransferCommission] Exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Commission transfer check failed' 
      };
    }
  }

  // Helper method to process transfer for a single training account
  private static async processSingleTrainingTransfer(user: any, trainingAccount: any): Promise<{ success: boolean; amount: number }> {
    try {
      const userId = user.id;
      const trainingAccountId = trainingAccount.id;

      console.log('[processSingleTrainingTransfer] Starting transfer - trainingAccountId:', trainingAccountId, 'trainingAccount.email:', trainingAccount.email);

      // Fetch training account fresh balance from training_accounts table (source of truth for training earnings)
      const { data: freshTraining, error: trainingFetchError } = await supabase
        .from('training_accounts')
        .select('amount')
        .eq('auth_user_id', trainingAccountId)
        .single();

      if (trainingFetchError) {
        console.error('[processSingleTrainingTransfer] Error fetching training account balance:', trainingFetchError);
        return { success: false, amount: 0 };
      }

      const earnedRewards = freshTraining?.amount || 0;
      const INITIAL_TRAINING_BALANCE = 1100;
      const trainingBalance = INITIAL_TRAINING_BALANCE + earnedRewards; // Full training total = initial + earned
      const commissionAmount = Math.round(trainingBalance * 0.02 * 100) / 100; // Exact 2% rounded to 2 decimals

      console.log('[Transfer] Processing transfer from training account:', trainingAccount.email, 'training_balance:', trainingBalance, 'commission:', commissionAmount);

      // Fetch fresh personal account balance from database
      const { data: freshUser, error: fetchError } = await supabase
        .from('users')
        .select('balance, total_earned')
        .eq('id', userId)
        .single();

      const currentBalance = freshUser?.balance || 0;
      const currentTotalEarned = freshUser?.total_earned || 0;

      // Transfer commission to personal account and activate full features
      // ADD commission to existing balance
      const newPersonalBalance = currentBalance + commissionAmount;
      const newPersonalTotalEarned = currentTotalEarned + commissionAmount;
      const { error: transferError } = await supabase
        .from('users')
        .update({
          balance: newPersonalBalance, // ADD commission to existing balance
          total_earned: newPersonalTotalEarned, // ADD commission to existing total_earned
          user_status: 'active', // Activate personal account full features
          training_completed: true, // Mark personal account as having completed training
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (transferError) {
        console.error('[processSingleTrainingTransfer] Transfer error:', transferError);
        return { success: false, amount: 0 };
      }

      // Subtract commission from training account balance - update both tables
      const remainingBalance = trainingBalance - commissionAmount;

      // Update training_accounts table - keep earned rewards only (subtract commission from earned)
      const remainingEarnedRewards = earnedRewards - commissionAmount;
      const { error: trainingAccountsUpdateError } = await supabase
        .from('training_accounts')
        .update({
          amount: remainingEarnedRewards,
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', trainingAccountId);

      if (trainingAccountsUpdateError) {
        console.error('[processSingleTrainingTransfer] Training accounts table update error:', trainingAccountsUpdateError);
        // Don't fail the transfer if training_accounts update fails, but log it
      }

      // Update users table - set balance to remaining amount but keep total_earned unchanged (earned rewards only)
      console.log('[processSingleTrainingTransfer] Updating training account balance in users table - trainingAccountId:', trainingAccountId, 'remainingBalance:', remainingBalance, 'earnedRewards:', earnedRewards);
      const { error: trainingUpdateError } = await supabase
        .from('users')
        .update({
          balance: remainingBalance,
          total_earned: earnedRewards, // Keep original earned rewards unchanged (don't include initial capital)
          commission_transferred: true,
          commission_transfer_amount: commissionAmount,
          commission_transferred_at: new Date().toISOString()
        })
        .eq('id', trainingAccountId);

      if (trainingUpdateError) {
        console.error('[processSingleTrainingTransfer] Training account balance update error:', trainingUpdateError);
        // CRITICAL: Fail the transfer if training account balance update fails
        // This prevents duplicate funds between training and personal accounts
        return { success: false, amount: 0 };
      }

      console.log('[processSingleTrainingTransfer] Training account balance updated successfully - new balance:', remainingBalance);

      // Reset personal account tasks to 0/35
      const { error: tasksResetError } = await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId);

      if (!tasksResetError) {
        // Create 35 new tasks for the personal account
        await this.createTrainingTasks(userId, 35);
      }

      // Create transaction record
      await this.createTransaction({
        user_id: userId,
        type: 'commission_transfer',
        amount: commissionAmount,
        description: `Training completion: 2% transfer ($${commissionAmount.toFixed(2)}) from training account`,
        status: 'completed'
      });

      // Send Telegram notification for successful transfer
      try {
        await TelegramService.sendTrainingCompletionTransferNotification({
          displayName: user.display_name || user.email,
          email: user.email,
          trainingAccountEmail: trainingAccount.email,
          trainingBalance: trainingBalance,
          transferredAmount: commissionAmount,
          timestamp: new Date().toISOString()
        });
        console.log('[Transfer] Telegram notification sent successfully');
      } catch (telegramError) {
        // Log error but don't break transfer flow
        console.error('[processSingleTrainingTransfer] Telegram notification failed:', telegramError);
      }

      console.log('[Transfer] transfer success - amount:', commissionAmount, 'for training account:', trainingAccount.email);
      return { success: true, amount: commissionAmount };
    } catch (error) {
      console.error('[processSingleTrainingTransfer] Exception:', error);
      return { success: false, amount: 0 };
    }
  }
}

export default SupabaseService;
