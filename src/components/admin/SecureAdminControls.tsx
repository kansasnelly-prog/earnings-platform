import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { SecurityManager, AdminLog } from '../../utils/security';
import { TaskSecurityManager, SecureTask } from '../../utils/taskSecurity';
import { supabase } from '../../lib/supabase';
import { 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  Eye,
  Trash2,
  Settings,
  Target,
  Clock,
  Award,
  X,
  Package
} from 'lucide-react';
import { Phase2Checkpoint, PersonalDay2Checkpoint, fixTestAccountBonus, SupabaseService } from '@/services/supabaseService';

// Union type for both checkpoint types
type AdminCheckpoint = Phase2Checkpoint | (PersonalDay2Checkpoint & { checkpoint_type: 'personal_day2' });
import { TelegramService } from '@/services/telegramService';
import { sendTelegramNotification } from '@/lib/realtime';

interface SecureAdminControlsProps {
  onRefresh: () => void;
}

const SecureAdminControls: React.FC<SecureAdminControlsProps> = ({ onRefresh }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [profitMultiplier] = useState(6);
  
  // Phase 2 checkpoint state
  const [pendingCheckpoints, setPendingCheckpoints] = useState<(Phase2Checkpoint & { checkpoint_type?: string })[]>([]);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<(Phase2Checkpoint & { checkpoint_type?: string }) | null>(null);
  const [checkpointNotes, setCheckpointNotes] = useState('');
  const [processingCheckpoint, setProcessingCheckpoint] = useState<string | null>(null);
  const [isFixingBonus, setIsFixingBonus] = useState(false);

  const handleFixTestAccountBonus = async () => {
    setIsFixingBonus(true);
    try {
      const result = await fixTestAccountBonus();
      if (result.success) {
        toast.success(`✅ Test account bonus fixed! Checkpoint ID: ${result.checkpointId}. Bonus updated from ${result.oldBonus} to ${result.newBonus}`);
        onRefresh();
      } else {
        toast.error(`❌ Failed to fix test account bonus: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`❌ Error fixing test account bonus: ${error.message}`);
    } finally {
      setIsFixingBonus(false);
    }
  };

  // Button protection
  const buttonProtection = SecurityManager.createButtonProtection();

  // Load admin logs
  useEffect(() => {
    const logs = SecurityManager.getAdminLogs();
    setAdminLogs(logs);
  }, []);

  // Secure reset personal account
  const resetPersonalAccount = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      // Validate email format
      if (!email.includes('@')) {
        toast.error('Invalid email format');
        return;
      }

      // Find account in localStorage
      const accountKey = 'opt_account_' + email;
      const accountData = localStorage.getItem(accountKey);
      
      if (!accountData) {
        toast.error('Personal account not found');
        return;
      }

      const account = JSON.parse(accountData);
      
      // Reset personal account tasks to 0/35
      const updatedUser = {
        ...account.user,
        tasks_completed: 0,
        tasks_progress: 0,
        training_completed: false,
        has_pending_order: false,
        pending_amount: 0,
        is_negative_balance: false,
        updated_at: new Date().toISOString()
      };
      
      // Save updated account
      localStorage.setItem(accountKey, JSON.stringify({
        ...account,
        user: updatedUser
      }));
      
      // Clear tasks from localStorage
      if (account.user?.id) {
        localStorage.removeItem('opt_tasks_' + account.user.id);
      }

      // Send Telegram notification
      await sendTelegramNotification('PERSONAL_ACCOUNT_RESET', {
        email: email,
        userId: account.user?.id || 'unknown',
        vipLevel: account.user?.vip_level || 0,
        balance: account.user?.balance || 0
      });

      toast.success(`Personal account ${email} has been reset successfully`);
      setResetEmail('');
      onRefresh();
    } catch (error) {
      toast.error(`Failed to reset personal account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Secure reset training account
  const resetTrainingAccount = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      // Validate email format
      if (!email.includes('@')) {
        toast.error('Invalid email format');
        return;
      }

      // Find user in Supabase by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, account_type')
        .eq('email', email)
        .maybeSingle();
      
      if (userError) {
        console.error('[Reset Training] Error finding user:', userError);
        toast.error('Error finding user in database');
        return;
      }
      
      if (!userData) {
        toast.error('User not found in database');
        return;
      }
      
      if (userData.account_type !== 'training') {
        toast.error('This is not a training account');
        return;
      }

      // Reset training_accounts.task_number to 1 in Supabase
      // Preserve amount/balance - only reset task_number
      const { error: updateError } = await supabase
        .from('training_accounts')
        .update({ 
          task_number: 1,
          completed: false
        })
        .eq('auth_user_id', userData.id);
      
      if (updateError) {
        console.error('[Reset Training] Error updating training_accounts:', updateError);
        toast.error('Failed to reset training account in database');
        return;
      }
      
      console.log('[Reset Training] Successfully reset task_number to 1 for user:', userData.id);

      // Also update localStorage if account exists there
      const accountKey = 'opt_account_' + email;
      const accountData = localStorage.getItem(accountKey);
      
      if (accountData) {
        const account = JSON.parse(accountData);
        
        // Reset training account tasks to 0/45
        const updatedUser = {
          ...account.user,
          task_number: 1,
          tasks_completed: 0,
          tasks_progress: 0,
          training_completed: false,
          training_progress: 0,
          training_phase: 1,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          trigger_task_number: null,
          updated_at: new Date().toISOString()
        };
        
        // Save updated account
        localStorage.setItem(accountKey, JSON.stringify({
          ...account,
          user: updatedUser
        }));
        
        // Clear tasks from localStorage
        if (account.user?.id) {
          localStorage.removeItem('opt_tasks_' + account.user.id);
          localStorage.removeItem('training_tasks_' + account.user.email);
        }
      }

      // Send Telegram notification
      await sendTelegramNotification('TRAINING_ACCOUNT_RESET', {
        email: email,
        userId: userData.id,
        vipLevel: 0,
        balance: 0
      });

      toast.success(`Training account ${email} has been reset successfully. Balance preserved.`);
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('[Reset Training] Unexpected error:', error);
      toast.error(`Failed to reset training account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const migrateAllTrainingAccounts = async () => {
    setIsResetting(true);
    try {
      let migratedCount = 0;
      
      // Search through all localStorage for training accounts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('training_tasks_') || key.startsWith('opt_tasks_'))) {
          const tasksData = localStorage.getItem(key);
          if (tasksData) {
            try {
              const tasks = JSON.parse(tasksData);
              
              // Check if tasks need migration (old reward amounts)
              const needsMigration = tasks.some((task: any) => 
                task.reward && (task.reward > 10 || task.reward < 0.5)
              );
              
              if (needsMigration) {
                // Extract email from key
                const email = key.replace('training_tasks_', '').replace('opt_tasks_', '');
                const migratedTasks = migrateExistingTasks(email, tasks);
                localStorage.setItem(key, JSON.stringify(migratedTasks));
                migratedCount++;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      toast.success(`Migrated ${migratedCount} training accounts`);
      onRefresh();
    } catch (error) {
      toast.error('Failed to migrate training accounts');
    } finally {
      setIsResetting(false);
    }
  };

  const migrateExistingTasks = (email: string, oldTasks: any[]) => {
    return oldTasks.map((task, index) => ({
      ...task,
      id: task.id || `task_${email}_${index}`,
      reward: Math.round((Math.random() * 2 + 0.5) * 100) / 100, // $0.50 - $2.50
      is_combo: task.is_combo || false,
      completed: false,
      timestamp: null
    }));
  };

  const removePendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    
    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      console.log('[Admin Pending Order] Email entered:', email);
      
      // Validate email format
      if (!email.includes('@')) {
        toast.error('Invalid email format');
        return;
      }

      // Find user in Supabase by email (check both users and training_accounts tables)
      let userId: string | null = null;
      let authUserId: string | null = null;
      
      // Override: Force Bypass - If email matches master, skip validation
      // kan112 and kansasnelly@gmail.com are treated as identical master admin keys
      const masterEmails = ['admin@test.com', 'kansasnelly@gmail.com', 'kan112'];
      
      // First check training_accounts table
      const { data: trainingAccount, error: trainingError } = await supabase
        .from('training_accounts')
        .select('id, auth_user_id, email')
        .eq('email', email)
        .maybeSingle();
      
      if (trainingError) {
        console.error('[Admin Pending Order] Error fetching training account:', trainingError);
      }
      
      if (trainingAccount) {
        console.log('[Admin Pending Order] User found in training_accounts:', trainingAccount.auth_user_id);
        userId = trainingAccount.id;
        authUserId = trainingAccount.auth_user_id;
      } else {
        // Check users table
        const { data: userAccount, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email)
          .maybeSingle();
        
        if (userError) {
          console.error('[Admin Pending Order] Error fetching user account:', userError);
        }
        
        if (userAccount) {
          console.log('[Admin Pending Order] User found in users table:', userAccount.id);
          userId = userAccount.id;
          authUserId = userAccount.id;
        }
      }
      
      if (!authUserId && !masterEmails.includes(email)) {
        console.log('[Admin Pending Order] No user found for email:', email);
        toast.error('No pending order found for this user.');
        return;
      }
      
      // Force override for master emails to allow bypass
      if (masterEmails.includes(email) && !authUserId) {
        console.log('[Admin Pending Order] Master email bypass activated for:', email);
        // Fallback to placeholder/safe IDs if not found to proceed with bypass
        authUserId = 'master-bypass-id'; 
      }
      
      console.log('[Admin Pending Order] User found, auth_user_id:', authUserId);
      
      // Find latest pending checkpoint for this user (check both phase2_checkpoints and personal_day2_checkpoints)
      // Override: Bypass checkpoint check if master email
      let finalCheckpoint: any = null;
      if (!masterEmails.includes(email)) {
        const { data: pendingCheckpoint, error: checkpointError } = await supabase
          .from('phase2_checkpoints')
          .select('*')
          .or(`email.eq.${email},auth_user_id.eq.${authUserId}`)
          .eq('status', 'pending_review')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        // If no phase2 checkpoint found, check for personal Day 2 checkpoint
        finalCheckpoint = pendingCheckpoint;
        if (!pendingCheckpoint) {
          const { data: personalCheckpoint, error: personalCheckpointError } = await supabase
            .from('personal_day2_checkpoints')
            .select('*')
            .or(`email.eq.${email},auth_user_id.eq.${authUserId}`)
            .eq('status', 'pending_review')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!personalCheckpointError && personalCheckpoint) {
            finalCheckpoint = personalCheckpoint;
            console.log('[Admin Pending Order] Personal Day 2 checkpoint found:', personalCheckpoint.id);
          }
        }
        
        if (checkpointError) {
          console.error('[Admin Pending Order] Error fetching checkpoint:', checkpointError);
          toast.error('Error checking for pending order');
          return;
        }
        
        if (!finalCheckpoint) {
          console.log('[Admin Pending Order] No pending checkpoint found for email:', email);
          toast.error('No pending order found for this user.');
          return;
        }
      } else {
        console.log('[Admin Pending Order] Master email bypass: bypassing checkpoint lookup');
        finalCheckpoint = { id: 'master-bypass-checkpoint', task_number: 0, bonus_amount: 0, product1_name: 'Bypass', product2_name: 'Bypass', product1_price: 0, product2_price: 0 };
      }
      
      console.log('[Admin Pending Order] Pending checkpoint found:', finalCheckpoint.id);
      
      // Get current admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      const adminId = adminUser?.id || 'admin';
      
      // Determine which table to update based on checkpoint type
      const isPersonalCheckpoint = finalCheckpoint.cycle !== undefined; // personal checkpoints have 'cycle' field
      const tableName = isPersonalCheckpoint ? 'personal_day2_checkpoints' : 'phase2_checkpoints';
      const checkpointType = isPersonalCheckpoint ? 'Personal Day 2' : 'Phase 2';
      
      // Update checkpoint to approved status (do NOT add bonus yet)
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminId,
          notes: 'Pending order removed by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', finalCheckpoint.id);
      
      if (updateError) {
        console.error('[Admin Pending Order] Error approving checkpoint:', updateError);
        toast.error('Failed to remove pending order');
        return;
      }
      
      // Create transaction record for the approval
      await supabase
        .from('transactions')
        .insert({
          user_id: authUserId,
          type: isPersonalCheckpoint ? 'personal_day2_checkpoint_approved' : 'phase2_checkpoint_approved',
          amount: 0,
          description: `${checkpointType} checkpoint approved via Remove Pending Order at task ${finalCheckpoint.task_number}`,
          status: 'completed',
          metadata: { 
            checkpoint_id: finalCheckpoint.id, 
            admin_id: adminId, 
            pending_bonus: finalCheckpoint.bonus_amount,
            method: 'remove_pending_order_button'
          },
          created_at: new Date().toISOString()
        });
      
      console.log('[Admin Pending Order] Checkpoint approved:', finalCheckpoint.id);
      
      // Send Telegram notification (don't block on failure)
      try {
        const combinationValue = finalCheckpoint.combination_value || 
          (finalCheckpoint.product1_price + finalCheckpoint.product2_price);
        
        const telegramMessage = `✅ <b>Pending Order Removed Successfully</b>\n\n` +
          `👤 <b>User Details:</b>\n` +
          `📧 Email: ${email}\n` +
          `🆔 Auth User ID: <code>${authUserId}</code>\n\n` +
          `📋 <b>Checkpoint Details:</b>\n` +
          `🎯 Type: ${checkpointType}\n` +
          `🔢 Task Number: ${finalCheckpoint.task_number}\n` +
          `📦 Product 1: ${finalCheckpoint.product1_name} ($${(finalCheckpoint.product1_price ?? 0).toFixed(2)})\n` +
          `📦 Product 2: ${finalCheckpoint.product2_name} ($${(finalCheckpoint.product2_price ?? 0).toFixed(2)})\n` +
          `💰 Combination Value: $${(combinationValue ?? 0).toFixed(2)}\n` +
          `💵 Pending Bonus: $${(finalCheckpoint.bonus_amount ?? 0).toFixed(2)}\n` +
          `✅ Status: APPROVED\n\n` +
          `⚙️ <b>Admin Action:</b>\n` +
          `🕐 Time: ${new Date().toLocaleString()}\n` +
          `📝 Method: Remove Pending Order button\n\n` +
          `🌐 Domain: earnings.ink`;
        
        TelegramService.sendAdminNotification('Admin', 'Checkpoint Approved - Pending Order Removed', telegramMessage)
          .then(sent => {
            if (sent) {
              console.log('[Admin Pending Order] Telegram notification sent successfully');
            } else {
              console.log('[Admin Pending Order] Telegram notification failed (non-blocking)');
            }
          })
          .catch(err => {
            console.error('[Admin Pending Order] Telegram error (non-blocking):', err);
          });
      } catch (telegramError) {
        console.error('[Admin Pending Order] Telegram notification error (non-blocking):', telegramError);
      }
      
      toast.success(`Pending order removed for ${email}. Checkpoint approved, user can now submit product.`);
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('[Admin Pending Order] Unexpected error:', error);
      toast.error(`Failed to remove pending order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const fixBalance = async () => {
    setIsResetting(true);
    try {
      let fixedCount = 0;
      
      // Search through all localStorage for accounts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('opt_account_')) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const account = JSON.parse(data);
              
              // Recalculate total earned from tasks
              const userId = account.user?.id;
              if (userId) {
                const tasksData = localStorage.getItem('opt_tasks_' + userId);
                if (tasksData) {
                  const tasks = JSON.parse(tasksData);
                  const completedTasks = tasks.filter((t: any) => t.completed);
                  const totalEarned = completedTasks.reduce((sum: number, t: any) => sum + (t.reward || 0), 0);
                  
                  // Update account with recalculated values
                  account.user.total_earned = totalEarned;
                  account.user.balance = totalEarned - (account.user.total_withdrawn || 0);
                  
                  localStorage.setItem(key, JSON.stringify(account));
                  fixedCount++;
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      toast.success(`Fixed balance for ${fixedCount} accounts`);
      onRefresh();
    } catch (error) {
      toast.error('Failed to fix balance');
    } finally {
      setIsResetting(false);
    }
  };

  // Phase 2 checkpoint functions
  const loadPendingCheckpoints = async () => {
    setLoadingCheckpoints(true);
    try {
      const phase2Checkpoints = await SupabaseService.getAllPendingCheckpoints();
      const personalDay2Checkpoints = await SupabaseService.getAllPendingPersonalDay2Checkpoints();
      
      // Combine both checkpoint types with proper typing
      const allCheckpoints: (Phase2Checkpoint & { checkpoint_type?: string })[] = [
        ...phase2Checkpoints.map(cp => ({ ...cp, checkpoint_type: 'phase2' as const })),
        ...personalDay2Checkpoints.map(cp => ({ 
          ...cp, 
          checkpoint_type: 'personal_day2' as const,
          phase: cp.cycle as number // Map cycle to phase for compatibility
        } as Phase2Checkpoint & { checkpoint_type?: string }))
      ];
      
      setPendingCheckpoints(allCheckpoints);
      console.log('[Admin] Loaded pending checkpoints:', allCheckpoints.length, '(Phase 2:', phase2Checkpoints.length, ', Personal Day 2:', personalDay2Checkpoints.length, ')');
    } catch (error) {
      console.error('[Admin] Error loading checkpoints:', error);
      toast.error('Failed to load pending checkpoints');
    } finally {
      setLoadingCheckpoints(false);
    }
  };
  
  const handleApproveCheckpoint = async (checkpointId: string, checkpointType: string = 'phase2') => {
    setProcessingCheckpoint(checkpointId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let result;
      if (checkpointType === 'personal_day2') {
        result = await SupabaseService.approvePersonalDay2Checkpoint(checkpointId, user?.id || 'admin', checkpointNotes);
      } else {
        result = await SupabaseService.approveCheckpoint(checkpointId, user?.id || 'admin', checkpointNotes);
      }
      
      if (result.success) {
        toast.success('Checkpoint approved! User can now submit product for 6x bonus.');
        setSelectedCheckpoint(null);
        setCheckpointNotes('');
        await loadPendingCheckpoints();
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to approve checkpoint');
      }
    } catch (error) {
      console.error('[Admin] Error approving checkpoint:', error);
      toast.error('Failed to approve checkpoint');
    } finally {
      setProcessingCheckpoint(null);
    }
  };
  
  const handleRejectCheckpoint = async (checkpointId: string) => {
    setProcessingCheckpoint(checkpointId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const result = await SupabaseService.rejectCheckpoint(checkpointId, user?.id || 'admin', checkpointNotes);
      
      if (result.success) {
        toast.success('Checkpoint rejected.');
        setSelectedCheckpoint(null);
        setCheckpointNotes('');
        await loadPendingCheckpoints();
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to reject checkpoint');
      }
    } catch (error) {
      console.error('[Admin] Error rejecting checkpoint:', error);
      toast.error('Failed to reject checkpoint');
    } finally {
      setProcessingCheckpoint(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Logs Section */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-blue-500" />
              Admin Activity Logs
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="border-slate-600 text-slate-300"
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </CardTitle>
        </CardHeader>
        {showLogs && (
          <CardContent>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {adminLogs.length === 0 ? (
                <p className="text-slate-400 text-sm">No admin activities recorded</p>
              ) : (
                adminLogs.slice(-10).reverse().map((log, index) => (
                  <div key={index} className="text-xs text-slate-300 p-2 bg-slate-700/50 rounded">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-blue-400">{log.action}</span>
                      <span className="text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {log.email && (
                      <div className="text-slate-400">Email: {log.email}</div>
                    )}
                    {log.details && (
                      <div className="text-slate-400 text-xs mt-1">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Account Management */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-green-500" />
            Secure Account Management
          </CardTitle>
          <p className="text-slate-400 text-sm">
            All actions are logged and validated for security
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Account Email Address
            </label>
            <Input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Enter email address"
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={resetPersonalAccount}
              disabled={isResetting || !resetEmail.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Personal Account
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={resetTrainingAccount}
              disabled={isResetting || !resetEmail.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Training Account
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Phase 2 Checkpoint Management */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="w-5 h-5 mr-2 text-amber-500" />
            Phase 2 Checkpoint Management
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Review and approve Phase 2 combination product checkpoints. Balance is preserved.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={loadPendingCheckpoints}
            disabled={loadingCheckpoints}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {loadingCheckpoints ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Load Pending Checkpoints ({pendingCheckpoints.length})
              </>
            )}
          </Button>
          
          {pendingCheckpoints.length > 0 && (
            <div className="space-y-3">
              {pendingCheckpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-white font-medium">{checkpoint.email}</span>
                        <span className="text-slate-400 text-sm">• Task {checkpoint.task_number}</span>
                      </div>
                      
                      {/* Product Pair Display */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex -space-x-2">
                          <img 
                            src={checkpoint.product1_image} 
                            alt=""
                            className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/334155/475569?text=P1'; }}
                          />
                          <img 
                            src={checkpoint.product2_image} 
                            alt=""
                            className="w-10 h-10 rounded border border-slate-600 bg-slate-800 object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/334155/475569?text=P2'; }}
                          />
                        </div>
                        <div className="text-xs text-slate-400">
                          <div className="truncate max-w-[150px]">{checkpoint.product1_name}</div>
                          <div className="truncate max-w-[150px]">{checkpoint.product2_name}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400 font-medium">+${checkpoint.bonus_amount.toFixed(2)} bonus</span>
                        <span className="text-slate-500">{new Date(checkpoint.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedCheckpoint(checkpoint)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {selectedCheckpoint && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
              <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Review Checkpoint</h3>
                  <button 
                    onClick={() => setSelectedCheckpoint(null)}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close checkpoint review"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-slate-400 text-sm">User</p>
                    <p className="text-white font-medium">{selectedCheckpoint.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <img 
                        src={selectedCheckpoint.product1_image} 
                        alt=""
                        className="w-full h-20 object-cover rounded mb-2"
                        crossOrigin="anonymous"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x80/334155/475569?text=P1'; }}
                      />
                      <p className="text-xs text-slate-400 truncate">{selectedCheckpoint.product1_name}</p>
                      <p className="text-xs text-amber-400">${selectedCheckpoint.product1_price.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <img 
                        src={selectedCheckpoint.product2_image} 
                        alt=""
                        className="w-full h-20 object-cover rounded mb-2"
                        crossOrigin="anonymous"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x80/334155/475569?text=P2'; }}
                      />
                      <p className="text-xs text-slate-400 truncate">{selectedCheckpoint.product2_name}</p>
                      <p className="text-xs text-amber-400">${selectedCheckpoint.product2_price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Combination Value */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-medium">Combination Value:</span>
                      </div>
                      <span className="text-amber-400 font-bold">${selectedCheckpoint.combination_value?.toFixed(2) || '259.98'}</span>
                    </div>
                    <p className="text-amber-300/70 text-xs mt-1">
                      Combined product value that will be processed after approval
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Pending Bonus: ${selectedCheckpoint.bonus_amount.toFixed(2)}</span>
                    </div>
                    <p className="text-green-300/70 text-xs mt-1">
                      Bonus will be added when user submits the checkpoint product
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
                    <textarea
                      value={checkpointNotes}
                      onChange={(e) => setCheckpointNotes(e.target.value)}
                      placeholder="Add review notes..."
                      className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApproveCheckpoint(selectedCheckpoint.id, selectedCheckpoint.checkpoint_type || 'phase2')}
                    disabled={processingCheckpoint === selectedCheckpoint.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingCheckpoint === selectedCheckpoint.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Checkpoint
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRejectCheckpoint(selectedCheckpoint.id)}
                    disabled={processingCheckpoint === selectedCheckpoint.id}
                    variant="outline"
                    className="border-red-500 text-red-400 hover:bg-red-500/10"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secure System Controls */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-yellow-500" />
            Secure System Controls
          </CardTitle>
          <p className="text-slate-400 text-sm">
            All system operations are validated and logged
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Combination Product Profit
            </label>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                value={profitMultiplier}
                disabled
                className="bg-slate-700 border-slate-600 text-white w-24 opacity-60"
              />
              <span className="text-slate-400 text-sm">x (Fixed for combo clearance)</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              6x profit automatically applied when clearing combination orders
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={migrateAllTrainingAccounts}
              disabled={isResetting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Migrating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Migrate All Training Accounts
                </>
              )}
            </Button>
            
            <Button
              onClick={removePendingOrder}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Removing...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Remove Pending Order
                </>
              )}
            </Button>

            <Button
              onClick={fixBalance}
              disabled={isResetting}
              variant="outline"
              className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
            >
              {isResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Fixing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Fix Balance (Recalculate)
                </>
              )}
            </Button>

            <Button
              onClick={handleFixTestAccountBonus}
              disabled={isFixingBonus}
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/20"
            >
              {isFixingBonus ? (
                <>
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mr-2" />
                  Fixing...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  Fix Test Account Bonus (water@gmail.com)
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
              <div>
                <p className="text-red-400 text-sm font-medium">Emergency Commission Transfer:</p>
                <ul className="text-red-300 text-xs space-y-1 mt-1">
                  <li>• Execute 2% commission transfer from training to personal account</li>
                  <li>• Updates both balances in single transaction</li>
                  <li>• Marks commission_transferred = true</li>
                </ul>
                <Button
                  onClick={async () => {
                    if (!confirm('Execute emergency commission transfer? This will update both account balances.')) return;
                    const result = await SupabaseService.executeEmergencyTransfer();
                    if (result.success) {
                      toast.success('Commission transfer executed successfully');
                    } else {
                      toast.error(result.error || 'Transfer failed');
                    }
                  }}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  Execute Emergency Transfer
                </Button>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
              <div>
                <p className="text-green-400 text-sm font-medium">Security Features:</p>
                <ul className="text-green-300 text-xs space-y-1 mt-1">
                  <li>• All actions are logged and timestamped</li>
                  <li>• Data validation prevents corruption</li>
                  <li>• Balance recalculation prevents manipulation</li>
                  <li>• Suspicious activity detection</li>
                  <li>• Button protection prevents double-clicks</li>
                  <li>• Session-based authentication</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureAdminControls;
