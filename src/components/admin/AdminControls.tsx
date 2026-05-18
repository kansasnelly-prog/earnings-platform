import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import {
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  UserX,
  Settings,
  DollarSign,
  TrendingUp,
  Users,
  Shield,
  Plus,
  Minus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SupabaseService } from '@/services/supabaseService';
import { TELEGRAM_CONFIG } from '../../config/telegram';
import { sendTelegramNotification } from '@/lib/realtime';

interface AdminControlsProps {
  onRefresh: () => void;
}

// MIGRATION: Update existing tasks with new realistic rewards
const migrateExistingTasks = (email: string, tasks: any[]) => {
  const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
  
  return tasks.map((task, i) => {
    const patternIndex = i % rewardPatterns.length;
    const baseReward = rewardPatterns[patternIndex];
    
    // Add small variation to make it realistic (±0.2)
    const variation = (Math.random() - 0.5) * 0.4;
    const finalReward = Math.max(0.5, baseReward + variation); // Minimum $0.50
    
    return {
      ...task,
      reward: Math.round(finalReward * 100) / 100,
    };
  });
};

const AdminControls: React.FC<AdminControlsProps> = ({ onRefresh }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [profitMultiplier, setProfitMultiplier] = useState(6);
  const [resetEmail, setResetEmail] = useState('');
  const [balanceAmount, setBalanceAmount] = useState(100);
  const [balanceReason, setBalanceReason] = useState('');

  // Manual Financial Reset State
  const [manualResetEmail, setManualResetEmail] = useState('');
  const [manualBalance, setManualBalance] = useState('1366.91');
  const [manualTotalEarned, setManualTotalEarned] = useState('0');
  const [manualPendingBalance, setManualPendingBalance] = useState('0');
  const [isManualResetting, setIsManualResetting] = useState(false);

  // Training Settings State
  const [trainingSettings, setTrainingSettings] = useState({
    checkpoint_multiplier: 6,
    training_completion_percentage: 2,
    phase2_target_final_balance: 2423.30,
    checkpoint_bonus_mode: 'dynamic'
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const resetPersonalAccount = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!resetEmail.trim()) {
      toast('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      console.log(`[AdminControls] ==========================================`);
      console.log(`[AdminControls] RESET PERSONAL ACCOUNT STARTED`);
      console.log(`[AdminControls] Email: ${email}`);
      console.log(`[AdminControls] ==========================================`);
      
      // PRIMARY: Use SupabaseService to reset personal account
      const result = await SupabaseService.resetPersonalAccount(email);
      
      if (!result.success) {
        console.error(`[AdminControls] RESET FAILED:`, result.error);
        toast.error(result.error || 'Failed to reset personal account in Supabase');
        return;
      }
      
      console.log(`[AdminControls] ==========================================`);
      console.log(`[AdminControls] RESET SUCCESSFUL`);
      console.log(`[AdminControls] Message: ${result.message}`);
      console.log(`[AdminControls] ==========================================`);
      
      // CRITICAL: Force refresh user state from Supabase to clear stale cached data
      // This ensures the frontend displays the updated balance, total_earned, and tasks_completed
      console.log(`[AdminControls] Forcing user state refresh from Supabase...`);
      onRefresh();
      
      // SECONDARY: Update localStorage as cache only (after Supabase success)
      // Wrap in try-catch to prevent localStorage errors from breaking the UI
      try {
        const accountKey = 'opt_account_' + email;
        const accountData = localStorage.getItem(accountKey);
        
        if (accountData) {
          let account;
          try {
            account = JSON.parse(accountData);
          } catch (parseError) {
            console.error('[AdminControls] Failed to parse account data from localStorage:', parseError);
            // Continue without localStorage update - database was reset successfully
          }
          
          if (account) {
            const userId = account.user?.id || account.id;
            
            // Check if Phase 1 is complete (35/35) to move to Phase 2
            const currentPhase = account.user?.training_phase || account.training_phase || 1;
            const tasksCompleted = account.user?.tasks_completed || account.tasks_completed || 0;
            const isPhase1Complete = currentPhase === 1 && tasksCompleted >= 35;
            const newPhase = isPhase1Complete ? 2 : 1;
            
            console.log(`[Personal Reset] Current phase: ${currentPhase}, Tasks: ${tasksCompleted}, IsPhase1Complete: ${isPhase1Complete}, NewPhase: ${newPhase}`);
            
            // Create fresh 35 tasks for the new phase with VIP1 rates (0.5%)
            const resetTasks = Array.from({ length: 35 }, (_, i) => {
              // VIP1 commission: 0.5% of product price
              const productPrice = Math.floor(Math.random() * 100) + 50; // $50-$150
              const commission = Math.round(productPrice * 0.005 * 100) / 100; // 0.5%
              
              return {
                id: `task-${Date.now()}-${i}`,
                user_id: userId,
                task_number: i + 1,
                title: `Personal Task ${i + 1} (Phase ${newPhase})`,
                description: `Complete personal task ${i + 1} for phase ${newPhase}`,
                status: i === 0 ? 'pending' : 'locked',
                reward: commission,
                created_at: new Date().toISOString()
              };
            });
            
            // Update user object
            const updatedUser = {
              ...account.user,
              tasks_completed: 0,
              training_phase: newPhase,
              training_progress: 0,
              has_pending_order: false,
              pending_amount: 0,
              is_negative_balance: false,
              trigger_task_number: null,
              profit_added: false,
              updated_at: new Date().toISOString()
            };
            
            // Save updated account
            try {
              localStorage.setItem(accountKey, JSON.stringify({
                ...account,
                user: updatedUser
              }));
            } catch (saveError) {
              console.error('[AdminControls] Failed to save account to localStorage:', saveError);
            }
            
            // Save new tasks
            if (userId) {
              try {
                const tasksKey = 'opt_tasks_' + userId;
                localStorage.setItem(tasksKey, JSON.stringify(resetTasks));
                console.log(`[Personal Reset] Created ${resetTasks.length} Phase ${newPhase} tasks for: ${email}, userId: ${userId}`);
              } catch (saveError) {
                console.error('[AdminControls] Failed to save tasks to localStorage:', saveError);
              }
            }
            
            // Update opt_user if currently logged in
            try {
              const currentUser = localStorage.getItem('opt_user');
              if (currentUser) {
                const user = JSON.parse(currentUser);
                if (user.email.toLowerCase() === email && user.account_type === 'personal') {
                  localStorage.setItem('opt_user', JSON.stringify(updatedUser));
                }
              }
            } catch (updateError) {
              console.error('[AdminControls] Failed to update opt_user in localStorage:', updateError);
            }
            
            const phaseMessage = newPhase === 2 ? 'Phase 2 reset (Set 2)' : 'Phase 1 reset (Set 1)';
            toast.success(`Personal account reset to 0/35 - ${phaseMessage}. Balance and earnings preserved.`);
            
            // Send Telegram notification immediately after database update succeeds
            // Wrap in try-catch to prevent notification errors from breaking the flow
            try {
              await sendTelegramNotification('PERSONAL_ACCOUNT_RESET', {
                email: email,
                userId: userId || 'unknown',
                vipLevel: account.user?.vip_level || 0,
                balance: account.user?.balance || 0,
                cycle: newPhase
              });
            } catch (telegramError) {
              console.error('[AdminControls] Telegram notification failed (non-critical):', telegramError);
            }
          } else {
            toast.success('Personal account reset successfully in database (localStorage cache not found)');
          }
        } else {
          toast.success('Personal account reset successfully in database (localStorage cache not found)');
        }
      } catch (localStorageError) {
        console.error('[AdminControls] localStorage update failed (non-critical):', localStorageError);
        toast.success('Personal account reset successfully in database (localStorage update failed)');
      }
      
      setResetEmail('');
      // Removed onRefresh() to prevent admin panel reload loop
    } catch (error) {
      console.error('[AdminControls] Error resetting personal account:', error);
      toast.error('Failed to reset personal account: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const addBalance = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (balanceAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const reason = balanceReason.trim() || 'Admin balance adjustment';
      
      console.log(`[AdminControls] [addBalance] Adding $${balanceAmount} to ${email}. Reason: ${reason}`);
      
      // PRIMARY: Use SupabaseService
      const result = await SupabaseService.adminAddBalance(email, balanceAmount, reason);
      
      if (!result.success) {
        console.error(`[AdminControls] [addBalance] Supabase failed:`, result.error);
        toast.error(result.error || 'Failed to add balance in Supabase');
        setIsResetting(false);
        return;
      }
      
      console.log(`[AdminControls] [addBalance] Supabase success. New balance: $${result.newBalance}`);
      
      // SECONDARY: Update localStorage cache
      const accountKey = 'opt_account_' + email;
      const trainingDataKey = 'opt_training_data_' + email;
      
      // Update personal account cache
      const accountData = localStorage.getItem(accountKey);
      if (accountData) {
        const account = JSON.parse(accountData);
        localStorage.setItem(accountKey, JSON.stringify({
          ...account,
          balance: result.newBalance,
          total_earned: (account.total_earned || 0) + balanceAmount
        }));
      }
      
      // Update training account cache
      const trainingData = localStorage.getItem(trainingDataKey);
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        localStorage.setItem(trainingDataKey, JSON.stringify({
          ...trainingAcc,
          balance: result.newBalance,
          total_earned: (trainingAcc.total_earned || 0) + balanceAmount
        }));
      }
      
      // Update opt_user if logged in
      const currentUser = localStorage.getItem('opt_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.email === email) {
          localStorage.setItem('opt_user', JSON.stringify({
            ...user,
            balance: result.newBalance,
            total_earned: (user.total_earned || 0) + balanceAmount
          }));
        }
      }
      
      toast.success(`✅ Added $${balanceAmount} to ${email}\nNew Balance: $${result.newBalance}`);
      console.log(`[AdminControls] [addBalance] Completed. Added $${balanceAmount}, new balance: $${result.newBalance}`);
      
      // Send Telegram notification
      const telegramMessage = `
💰 <b>ADMIN: BALANCE ADDED</b>

👤 <b>Email:</b> ${email}
💵 <b>Amount Added:</b> $${balanceAmount}
💵 <b>New Balance:</b> $${result.newBalance}
📝 <b>Reason:</b> ${reason}
⚙️ <b>Source:</b> Supabase (primary)
📅 <b>Timestamp:</b> ${new Date().toLocaleString()}
      `.trim();

      try {
        await sendTelegramNotification('ADMIN_ACTION', {
          action: 'BALANCE_ADDED',
          admin: 'Admin',
          details: {
            email: email,
            amount: balanceAmount,
            newBalance: result.newBalance,
            reason: reason,
            timestamp: new Date().toISOString()
          }
        });
      } catch (telegramError) {
        console.error('[AdminControls] [addBalance] Telegram notification failed:', telegramError);
      }
      
      setResetEmail('');
      setBalanceReason('');
      onRefresh();
    } catch (error) {
      console.error('[AdminControls] [addBalance] Exception:', error);
      toast.error('Failed to add balance: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const reduceBalance = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (balanceAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const reason = balanceReason.trim() || 'Admin balance adjustment';
      
      console.log(`[AdminControls] [reduceBalance] Reducing balance by $${balanceAmount} for ${email}. Reason: ${reason}`);
      
      // PRIMARY: Use SupabaseService
      const result = await SupabaseService.adminReduceBalance(email, balanceAmount, reason);
      
      if (!result.success) {
        console.error(`[AdminControls] [reduceBalance] Supabase failed:`, result.error);
        toast.error(result.error || 'Failed to reduce balance in Supabase');
        setIsResetting(false);
        return;
      }
      
      console.log(`[AdminControls] [reduceBalance] Supabase success. New balance: $${result.newBalance}`);
      
      // SECONDARY: Update localStorage cache
      const accountKey = 'opt_account_' + email;
      const trainingDataKey = 'opt_training_data_' + email;
      
      // Update personal account cache
      const accountData = localStorage.getItem(accountKey);
      if (accountData) {
        const account = JSON.parse(accountData);
        localStorage.setItem(accountKey, JSON.stringify({
          ...account,
          balance: result.newBalance
        }));
      }
      
      // Update training account cache
      const trainingData = localStorage.getItem(trainingDataKey);
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        localStorage.setItem(trainingDataKey, JSON.stringify({
          ...trainingAcc,
          balance: result.newBalance
        }));
      }
      
      // Update opt_user if logged in
      const currentUser = localStorage.getItem('opt_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.email === email) {
          localStorage.setItem('opt_user', JSON.stringify({
            ...user,
            balance: result.newBalance
          }));
        }
      }
      
      toast.success(`✅ Reduced balance by $${balanceAmount} for ${email}\nNew Balance: $${result.newBalance}`);
      console.log(`[AdminControls] [reduceBalance] Completed. Reduced $${balanceAmount}, new balance: $${result.newBalance}`);
      
      // Send Telegram notification
      try {
        await sendTelegramNotification('ADMIN_ACTION', {
          action: 'BALANCE_REDUCED',
          admin: 'Admin',
          details: {
            email: email,
            amount: balanceAmount,
            newBalance: result.newBalance,
            reason: reason,
            timestamp: new Date().toISOString()
          }
        });
      } catch (telegramError) {
        console.error('[AdminControls] [reduceBalance] Telegram notification failed:', telegramError);
      }
      
      setResetEmail('');
      setBalanceReason('');
      onRefresh();
    } catch (error) {
      console.error('[AdminControls] [reduceBalance] Exception:', error);
      toast.error('Failed to reduce balance: ' + (error as Error).message);
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
      
      toast.success(`Migration Complete! Updated ${migratedCount} training accounts with new realistic rewards.`);
      onRefresh();
    } catch (error) {
      console.error('Error migrating accounts:', error);
      toast.error('Failed to migrate accounts');
    } finally {
      setIsResetting(false);
    }
  };

  const resetTrainingAccount = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      console.log(`[AdminControls] ==========================================`);
      console.log(`[AdminControls] RESET TRAINING ACCOUNT STARTED`);
      console.log(`[AdminControls] Email: ${email}`);
      console.log(`[AdminControls] ==========================================`);
      
      // PRIMARY: Use SupabaseService to reset training account
      const result = await SupabaseService.resetTrainingAccount(email);
      
      if (!result.success) {
        console.error(`[AdminControls] RESET FAILED:`, result.error);
        toast.error(result.error || 'Failed to reset training account in Supabase');
        return;
      }
      
      console.log(`[AdminControls] ==========================================`);
      console.log(`[AdminControls] RESET SUCCESSFUL`);
      console.log(`[AdminControls] Message: ${result.message}`);
      console.log(`[AdminControls] ==========================================`);
      
      // CRITICAL: Force refresh user state from Supabase to clear stale cached data
      // This ensures the frontend displays the updated balance, total_earned, and tasks_completed
      console.log(`[AdminControls] Forcing user state refresh from Supabase...`);
      onRefresh();
      
      // SECONDARY: Update localStorage as cache only (after Supabase success)
      // Wrap in try-catch to prevent localStorage errors from breaking the UI
      try {
        const accountKey = 'training_account_' + email;
        const optTrainingDataKey = 'opt_training_data_' + email;
        const tasksKey = 'training_tasks_' + email;
        
        // Reset tasks to 0/45 - create fresh tasks REALISTIC PRODUCT-BASED REWARDS
        const rewardPatterns = [0.7, 1.6, 2.5, 6.4, 7.2];
        const resetTasks = Array.from({ length: 45 }, (_, i) => {
          const patternIndex = i % rewardPatterns.length;
          const baseReward = rewardPatterns[patternIndex];
          
          // Add small variation to make it realistic (±0.2)
          const variation = (Math.random() - 0.5) * 0.4;
          const finalReward = Math.max(0.5, baseReward + variation); // Minimum $0.50
          
          return {
            id: `task-${Date.now()}-${i}`,
            task_number: i + 1,
            title: `Training Task ${i + 1}`,
            description: `Complete training task ${i + 1}`,
            status: i === 0 ? 'pending' : 'locked',
            reward: Math.round(finalReward * 100) / 100,
            created_at: new Date().toISOString(),
            completed_at: null,
          };
        });
        
        // Update localStorage cache (non-blocking)
        const possibleTaskKeys = [
          tasksKey,
          'opt_tasks_' + email,
          'training_tasks_' + email
        ];
        
        possibleTaskKeys.forEach(key => {
          try {
            localStorage.setItem(key, JSON.stringify(resetTasks));
            console.log(`[AdminControls] [resetTrainingAccount] Updated cache: ${key}`);
          } catch (saveError) {
            console.error(`[AdminControls] Failed to save tasks to ${key}:`, saveError);
          }
        });
        
        // Update training account cache
        try {
          const trainingData = localStorage.getItem(accountKey);
          if (trainingData) {
            let trainingAcc;
            try {
              trainingAcc = JSON.parse(trainingData);
              localStorage.setItem(accountKey, JSON.stringify({
                ...trainingAcc,
                tasks_completed: 0,
                training_progress: 0,
                training_phase: result.message?.includes('Phase 2') ? 2 : 1,
                training_completed: false,
                trigger_task_number: null,
                has_pending_order: false,
                pending_amount: 0,
                is_negative_balance: false,
                profit_added: false,
                reset_at: new Date().toISOString(),
                reset_by: 'admin'
              }));
            } catch (parseError) {
              console.error('[AdminControls] Failed to parse training account data:', parseError);
            }
          }
        } catch (cacheError) {
          console.error('[AdminControls] Failed to update training account cache:', cacheError);
        }
        
        // Update opt_training_data cache
        try {
          const existingOptData = localStorage.getItem(optTrainingDataKey);
          if (existingOptData) {
            let optData;
            try {
              optData = JSON.parse(existingOptData);
              localStorage.setItem(optTrainingDataKey, JSON.stringify({
                ...optData,
                tasks_completed: 0,
                training_progress: 0,
                training_phase: result.message?.includes('Phase 2') ? 2 : 1,
                has_pending_order: false,
                pending_amount: 0,
                is_negative_balance: false,
                profit_added: false
              }));
            } catch (parseError) {
              console.error('[AdminControls] Failed to parse opt_training_data:', parseError);
            }
          }
        } catch (cacheError) {
          console.error('[AdminControls] Failed to update opt_training_data cache:', cacheError);
        }
        
        // Update opt_user if currently logged in
        try {
          const currentUser = localStorage.getItem('opt_user');
          if (currentUser) {
            const user = JSON.parse(currentUser);
            if (user.email === email && user.account_type === 'training') {
              const resetUser = {
                ...user,
                tasks_completed: 0,
                training_progress: 0,
                training_phase: result.message?.includes('Phase 2') ? 2 : 1,
                has_pending_order: false,
                pending_amount: 0,
                is_negative_balance: false,
                profit_added: false
              };
              localStorage.setItem('opt_user', JSON.stringify(resetUser));
              window.dispatchEvent(new Event('training-account-reset'));
            }
          }
        } catch (updateError) {
          console.error('[AdminControls] Failed to update opt_user in localStorage:', updateError);
        }
        
        // Show detailed success toast
        const isPhase2 = result.message?.includes('Phase 2');
        toast.success(
          isPhase2 
            ? `✅ Phase 2 Activated!\n${email}\nBalance & earnings preserved` 
            : `✅ Training Account Reset!\n${email}\nPhase 1 restarted (0/45 tasks)`
        );
        
        // Send Telegram notification immediately after database update succeeds
        try {
          await sendTelegramNotification('TRAINING_ACCOUNT_RESET', {
            email: email,
            userId: 'unknown',
            vipLevel: 0,
            balance: 0
          });
        } catch (telegramError) {
          console.error('[AdminControls] [resetTrainingAccount] Telegram notification failed (non-critical):', telegramError);
        }
      } catch (localStorageError) {
        console.error('[AdminControls] localStorage update failed (non-critical):', localStorageError);
        toast.success('Training account reset successfully in database (localStorage update failed)');
      }
      
      setResetEmail('');
      // Removed onRefresh() to prevent admin panel reload loop
    } catch (error) {
      console.error('[AdminControls] [resetTrainingAccount] Exception:', error);
      toast.error('Failed to reset training account: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const removePendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      console.log(`[Admin Approve Checkpoint] email: ${email}`);
      console.log(`[Admin Approve Checkpoint] Starting checkpoint approval process...`);
      
      // PRIMARY: Use SupabaseService to approve checkpoint (user will submit premium product later)
      const result = await SupabaseService.removePendingOrder(email);
      
      if (!result.success) {
        console.error(`[Admin Approve Checkpoint] Supabase approval failed:`, result.error);
        toast.error(result.error || 'Failed to approve checkpoint: ' + result.error);
        setIsResetting(false);
        return;
      }
      
      const checkpointId = result.checkpointId;
      const bonusAmount = result.bonusAmount || 0;
      
      console.log(`[Admin Approve Checkpoint] found checkpoint: ${checkpointId}`);
      console.log(`[Admin Approve Checkpoint] updated to approved - Bonus pending: $${bonusAmount}`);
      
      // SECONDARY: Update localStorage as cache only (after Supabase success)
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        localStorage.setItem(trainingDataKey, JSON.stringify({
          ...trainingAcc,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          checkpoint_approved: true,
          checkpoint_id: checkpointId,
          pending_bonus: bonusAmount,
          approved_at: new Date().toISOString(),
          approved_by: 'admin',
          approved_source: 'supabase'
        }));
        console.log(`[Admin Approve Checkpoint] Updated localStorage cache: ${trainingDataKey}`);
      }
      
      // Update opt_training_ login cache
      const trainingKey = 'opt_training_' + email;
      const trainingLoginData = localStorage.getItem(trainingKey);
      if (trainingLoginData) {
        const loginData = JSON.parse(trainingLoginData);
        localStorage.setItem(trainingKey, JSON.stringify({
          ...loginData,
          has_pending_order: false,
          pending_amount: 0,
          is_negative_balance: false,
          checkpoint_approved: true,
          checkpoint_id: checkpointId,
          pending_bonus: bonusAmount
        }));
      }
      
      // Update opt_user if currently logged in
      const currentUser = localStorage.getItem('opt_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.email === email && user.account_type === 'training') {
          localStorage.setItem('opt_user', JSON.stringify({
            ...user,
            has_pending_order: false,
            pending_amount: 0,
            is_negative_balance: false,
            checkpoint_approved: true,
            checkpoint_id: checkpointId,
            pending_bonus: bonusAmount,
            phase2_checkpoint: {
              ...user.phase2_checkpoint,
              status: 'approved'
            }
          }));
        }
      }
      
      toast.success(`✅ CHECKPOINT APPROVED!\nCheckpoint ID: ${checkpointId}\nPending Bonus: $${bonusAmount}\n\nUser must now click "Submit Premium Product" to receive the bonus and continue tasks.`);
      console.log(`[Admin Approve Checkpoint] COMPLETED for ${email}`);
      console.log(`[Admin Approve Checkpoint] Checkpoint ${checkpointId} approved. User must submit premium product to receive $${bonusAmount} bonus.`);
      
      setResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('[Admin Approve Checkpoint] Exception:', error);
      toast.error('Failed to approve checkpoint: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const completeTrainingAndTransfer = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter a training account email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      
      // First, try to find in Supabase
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase error:', supabaseError);
      }
      
      if (supabaseUser) {
        // Use the new SupabaseService function
        const result = await SupabaseService.completeTrainingAndTransferBalance(supabaseUser.id);
        
        if (result.success) {
          toast.success(`✅ Training Completed!\nTransferred: $${result.transferredAmount?.toFixed(2)} to personal account`);
          console.log('[Admin] Training completed and balance transferred:', result);
          setResetEmail('');
          onRefresh();
        } else {
          toast.error('Failed to complete training: ' + result.error);
        }
        setIsResetting(false);
        return;
      }
      
      // If not in Supabase, check localStorage
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (!trainingData) {
        toast.error('Training account not found in database or localStorage');
        setIsResetting(false);
        return;
      }
      
      const trainingAcc = JSON.parse(trainingData);
      const trainingBalance = trainingAcc.balance || trainingAcc.user?.balance || 0;
      
      if (trainingBalance <= 0) {
        toast.error('No balance to transfer from training account');
        setIsResetting(false);
        return;
      }
      
      // For localStorage accounts, we can only update local state
      // Mark training as completed
      trainingAcc.training_completed = true;
      trainingAcc.user.training_completed = true;
      localStorage.setItem(trainingDataKey, JSON.stringify(trainingAcc));
      
      toast.success(`✅ Training marked as completed (localStorage only)\nBalance would be: $${trainingBalance.toFixed(2)}\n\nNote: For full transfer, account must be in Supabase database.`);
      console.log('[Admin] Training marked complete (localStorage):', trainingAcc);
      setResetEmail('');
      onRefresh();
      setIsResetting(false);
    } catch (error) {
      console.error('Error completing training:', error);
      toast.error('Failed to complete training: ' + (error as Error).message);
      setIsResetting(false);
    }
  };

  const triggerPendingOrder = async () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsResetting(true);
    try {
      const email = resetEmail.trim().toLowerCase();
      const combinationAmount = 210; // Fixed amount for combination product
      
      // First, try to find in Supabase
      const { data: supabaseUser, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase error:', supabaseError);
      }
      
      if (supabaseUser) {
        // Check if in phase 2 - MANDATORY
        if (supabaseUser.training_phase !== 2) {
          toast.error(`MUST BE IN PHASE 2! Current phase: ${supabaseUser.training_phase || 1}. Complete Phase 1 first (45/45 tasks).`);
          setIsResetting(false);
          return;
        }
        
        // Check if already has pending order
        if (supabaseUser.has_pending_order) {
          toast.error('Training account already has a pending order!');
          setIsResetting(false);
          return;
        }
        
        // Calculate new balance for pending order
        const currentBalance = supabaseUser.balance || 0;
        const newBalance = currentBalance - combinationAmount;
        
        // Update Supabase - always Phase 2 for pending order
        const { error: updateError } = await supabase
          .from('users')
          .update({
            training_phase: 2,
            has_pending_order: true,
            pending_amount: combinationAmount,
            is_negative_balance: true,
            trigger_task_number: 31,
            balance: newBalance
          })
          .eq('id', supabaseUser.id);
        
        // Update opt_user if currently logged in
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              has_pending_order: true,
              pending_amount: combinationAmount,
              is_negative_balance: true,
              trigger_task_number: 31,
              balance: newBalance
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER TRIGGERED FOR PHASE 2!\nBalance: -$${combinationAmount}\nTasks will be LOCKED until cleared.`);
        console.log(`[Admin] Triggered pending order for ${email} in Supabase. Amount: $${combinationAmount}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      // If not in Supabase, try localStorage as fallback
      const trainingDataKey = 'opt_training_data_' + email;
      const trainingData = localStorage.getItem(trainingDataKey);
      
      if (trainingData) {
        const trainingAcc = JSON.parse(trainingData);
        
        // Check if in phase 2 - MANDATORY
        if (trainingAcc.training_phase !== 2) {
          toast.error(`MUST BE IN PHASE 2! Current phase: ${trainingAcc.training_phase || 1}. Complete Phase 1 first (45/45 tasks).`);
          setIsResetting(false);
          return;
        }
        
        // Check if already has pending order
        if (trainingAcc.has_pending_order) {
          toast.error('Training account already has a pending order!');
          setIsResetting(false);
          return;
        }
        
        const updatedTrainingAcc = {
          ...trainingAcc,
          has_pending_order: true,
          pending_amount: combinationAmount,
          is_negative_balance: true,
          trigger_task_number: 31,
          balance: (trainingAcc.balance || 0) - combinationAmount,
          pending_triggered_at: new Date().toISOString(),
          pending_triggered_by: 'admin'
        };
        
        localStorage.setItem(trainingDataKey, JSON.stringify(updatedTrainingAcc));
        
        // Update other localStorage keys
        const trainingKey = 'opt_training_' + email;
        const trainingLoginData = localStorage.getItem(trainingKey);
        if (trainingLoginData) {
          const loginData = JSON.parse(trainingLoginData);
          localStorage.setItem(trainingKey, JSON.stringify({
            ...loginData,
            has_pending_order: true,
            pending_amount: combinationAmount,
            is_negative_balance: true,
            trigger_task_number: 31,
            balance: (loginData.balance || 0) - combinationAmount
          }));
        }
        
        const currentUser = localStorage.getItem('opt_user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          if (user.email === email && user.account_type === 'training') {
            localStorage.setItem('opt_user', JSON.stringify({
              ...user,
              has_pending_order: true,
              pending_amount: combinationAmount,
              is_negative_balance: true,
              trigger_task_number: 31,
              balance: (user.balance || 0) - combinationAmount
            }));
          }
        }
        
        toast.success(`✅ PENDING ORDER TRIGGERED FOR PHASE 2!\nBalance: -$${combinationAmount}\nTasks will be LOCKED until cleared.`);
        console.log(`[Admin] Triggered pending order for ${email} in localStorage. Amount: $${combinationAmount}`);
        setResetEmail('');
        onRefresh();
        setIsResetting(false);
        return;
      }
      
      toast.error('Training account not found in Supabase or localStorage. Please check the email address.');
      setIsResetting(false);
    } catch (error) {
      console.error('Error triggering pending order:', error);
      toast.error('Failed to trigger pending order: ' + (error as Error).message);
    } finally {
      setIsResetting(false);
    }
  };

  const fixBalance = () => {
    if (!resetEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const email = resetEmail.trim().toLowerCase();
    const trainingDataKey = 'opt_training_data_' + email;
    const trainingData = localStorage.getItem(trainingDataKey);
    
    if (!trainingData) {
      toast.error('Training account not found');
      return;
    }

    const trainingAcc = JSON.parse(trainingData);
    
    // Calculate correct balance:
    // Total Earned includes all task earnings
    // Balance should be: Total Earned - Pending Amount + (6x Profit if pending cleared)
    const totalEarned = trainingAcc.total_earned || 0;
    const pendingAmount = trainingAcc.pending_amount || 0;
    const hasPending = trainingAcc.has_pending_order || false;
    
    let correctBalance = totalEarned;
    
    if (hasPending && pendingAmount > 0) {
      // If there's a pending order, the balance was deducted by pendingAmount
      // So current balance = totalEarned - pendingAmount (negative)
      correctBalance = totalEarned - pendingAmount;
    }
    
    // Update the training data
    trainingAcc.balance = correctBalance;
    localStorage.setItem(trainingDataKey, JSON.stringify(trainingAcc));
    
    // Also update login key
    const trainingKey = 'opt_training_' + email;
    const loginData = localStorage.getItem(trainingKey);
    if (loginData) {
      const login = JSON.parse(loginData);
      login.balance = correctBalance;
      localStorage.setItem(trainingKey, JSON.stringify(login));
    }
    
    toast.success(`Balance fixed: $${correctBalance.toFixed(2)} (based on Total Earned: $${totalEarned})`);
    onRefresh();
  };

  const manualResetFinancialValues = async () => {
    if (!manualResetEmail.trim()) {
      toast.error('Please enter a training account email address');
      return;
    }

    setIsManualResetting(true);
    try {
      const email = manualResetEmail.trim().toLowerCase();
      const balance = parseFloat(manualBalance);
      const totalEarned = parseFloat(manualTotalEarned);
      const pendingBalance = parseFloat(manualPendingBalance);

      if (isNaN(balance) || isNaN(totalEarned) || isNaN(pendingBalance)) {
        toast.error('Please enter valid numeric values');
        setIsManualResetting(false);
        return;
      }

      console.log('[Admin Manual Reset] Updating training account financial values:', {
        email,
        balance,
        totalEarned,
        pendingBalance
      });

      // Find training account in Supabase
      const { data: trainingAccount, error: findError } = await supabase
        .from('training_accounts')
        .select('*')
        .eq('email', email)
        .single();

      if (findError || !trainingAccount) {
        toast.error('Training account not found in database');
        setIsManualResetting(false);
        return;
      }

      // Update training_accounts table
      const { error: updateError } = await supabase
        .from('training_accounts')
        .update({
          amount: balance,
          commission: totalEarned,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingAccount.id);

      if (updateError) {
        console.error('[Admin Manual Reset] Error updating training_accounts:', updateError);
        toast.error('Failed to update training account: ' + updateError.message);
        setIsManualResetting(false);
        return;
      }

      // Update users table for pending_balance
      const { data: user, error: userFindError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('account_type', 'training')
        .single();

      if (!userFindError && user) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            pending_amount: pendingBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (userUpdateError) {
          console.error('[Admin Manual Reset] Error updating users pending_balance:', userUpdateError);
        }
      }

      toast.success(`✅ Financial values updated for ${email}\n\nBalance: $${balance.toFixed(2)}\nTotal Earned: $${totalEarned.toFixed(2)}\nPending Balance: $${pendingBalance.toFixed(2)}`);
      console.log('[Admin Manual Reset] Successfully updated financial values');
      setManualResetEmail('');
      onRefresh();
    } catch (error) {
      console.error('[Admin Manual Reset] Exception:', error);
      toast.error('Failed to update financial values: ' + (error as Error).message);
    } finally {
      setIsManualResetting(false);
    }
  };

  // ===========================================
  // TRAINING SETTINGS FUNCTIONS
  // ===========================================

  const loadTrainingSettings = async () => {
    setIsLoadingSettings(true);
    try {
      console.log('[AdminControls] Loading training settings...');
      const settings = await SupabaseService.getTrainingSettings();
      console.log('[AdminControls] Training settings loaded:', settings);
      setTrainingSettings(settings);
    } catch (error) {
      console.error('[AdminControls] Error loading training settings:', error);
      toast.error('Failed to load training settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const saveTrainingSettings = async () => {
    setIsSavingSettings(true);
    try {
      console.log('[AdminControls] Saving training settings:', trainingSettings);
      const result = await SupabaseService.updateTrainingSettings(trainingSettings);
      
      if (result.success) {
        toast.success('Training settings saved successfully');
        console.log('[AdminControls] Training settings saved');
      } else {
        toast.error('Failed to save settings: ' + result.error);
      }
    } catch (error) {
      console.error('[AdminControls] Error saving training settings:', error);
      toast.error('Failed to save training settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadTrainingSettings();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Admin Controls</h2>
          <p className="text-slate-400">Manage training system and user accounts</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Reset Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RotateCcw className="w-5 h-5 mr-2 text-orange-500" />
              Account Reset Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Reset personal and training accounts
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  User Email Address
                </label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  type="button"
                  onClick={(e) => resetPersonalAccount(e)}
                  disabled={isResetting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Reset Personal Account
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={(e) => resetTrainingAccount(e)}
                  disabled={isResetting}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-700"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Training Account
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={(e) => completeTrainingAndTransfer(e)}
                  disabled={isResetting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isResetting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Training & Transfer Balance
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 text-sm font-medium">Reset Effects:</p>
                  <ul className="text-orange-300 text-xs space-y-1 mt-1">
                    <li>• Personal: Tasks reset to 0/35, balance & earnings preserved</li>
                    <li>• Training: Tasks reset to 0/45, balance & earnings preserved</li>
                    <li>• All progress and pending orders cleared</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-emerald-400 text-sm font-medium">Complete Training & Transfer:</p>
                  <ul className="text-emerald-300 text-xs space-y-1 mt-1">
                    <li>• Transfers ALL training balance to linked personal account</li>
                    <li>• Marks training as completed on both accounts</li>
                    <li>• Creates transaction records for the transfer</li>
                    <li>• Training account balance will be set to $0</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Financial Reset */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-yellow-500" />
              Manual Financial Reset
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Manually set training account financial values for testing
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Training Account Email
              </label>
              <Input
                type="email"
                value={manualResetEmail}
                onChange={(e) => setManualResetEmail(e.target.value)}
                placeholder="ronikaa22@gmail.com"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Balance ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualBalance}
                  onChange={(e) => setManualBalance(e.target.value)}
                  placeholder="1366.91"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Total Earned ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualTotalEarned}
                  onChange={(e) => setManualTotalEarned(e.target.value)}
                  placeholder="0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pending Balance ($)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={manualPendingBalance}
                  onChange={(e) => setManualPendingBalance(e.target.value)}
                  placeholder="0"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <Button
              onClick={manualResetFinancialValues}
              disabled={isManualResetting}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
            >
              {isManualResetting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Update Financial Values
                </>
              )}
            </Button>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Use Case:</p>
                  <ul className="text-yellow-300 text-xs space-y-1 mt-1">
                    <li>• Testing training/checkpoint flows without preserving inflated balances</li>
                    <li>• Manually set balance, total_earned, and pending_balance for specific users</li>
                    <li>• Admin only - no effect on global training settings</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-500" />
              System Controls
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Configure training system parameters
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Training Settings Section */}
            <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-medium flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-amber-400" />
                  Training Reward Settings
                </h4>
                {isLoadingSettings && (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="space-y-4">
                {/* Checkpoint Multiplier */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Checkpoint Profit Multiplier
                  </label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="20"
                      value={trainingSettings.checkpoint_multiplier}
                      onChange={(e) => setTrainingSettings(prev => ({
                        ...prev,
                        checkpoint_multiplier: parseFloat(e.target.value) || 6
                      }))}
                      className="bg-slate-700 border-slate-600 text-white w-24"
                    />
                    <span className="text-slate-400 text-sm">x (e.g., 6 = 6x profit)</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Multiplier applied to checkpoint bonus calculations
                  </p>
                </div>

                {/* Training Completion Percentage */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Training Completion Transfer %
                  </label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={trainingSettings.training_completion_percentage}
                      onChange={(e) => setTrainingSettings(prev => ({
                        ...prev,
                        training_completion_percentage: parseFloat(e.target.value) || 2
                      }))}
                      className="bg-slate-700 border-slate-600 text-white w-24"
                    />
                    <span className="text-slate-400 text-sm">% (transfer to personal account)</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Percentage transferred when training is completed
                  </p>
                </div>

                {/* Target Final Balance */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Phase 2 Target Final Balance
                  </label>
                  <div className="flex items-center space-x-3">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={trainingSettings.phase2_target_final_balance}
                      onChange={(e) => setTrainingSettings(prev => ({
                        ...prev,
                        phase2_target_final_balance: parseFloat(e.target.value) || 2423.30
                      }))}
                      className="bg-slate-700 border-slate-600 text-white w-32"
                    />
                    <span className="text-slate-400 text-sm">$</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Target balance for Phase 2 training completion
                  </p>
                </div>

                {/* Bonus Mode */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">
                    Checkpoint Bonus Mode
                  </label>
                  <select
                    value={trainingSettings.checkpoint_bonus_mode}
                    onChange={(e) => setTrainingSettings(prev => ({
                      ...prev,
                      checkpoint_bonus_mode: e.target.value
                    }))}
                    className="bg-slate-700 border-slate-600 text-white rounded-md px-3 py-2 text-sm w-full"
                  >
                    <option value="dynamic">Dynamic (Based on product prices)</option>
                    <option value="fixed">Fixed (Using target balance)</option>
                    <option value="manual">Manual (Admin sets per checkpoint)</option>
                  </select>
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveTrainingSettings}
                  disabled={isSavingSettings || isLoadingSettings}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  {isSavingSettings ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Settings className="w-4 h-4 mr-2" />
                      Save Training Settings
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* TEST: Simple migration button */}
              <button
                onClick={() => {
                  alert('Migration button clicked!');
                  console.log('Migration test');
                }}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                🔄 TEST: Migrate All Training Accounts
              </button>
              
              <Button
                onClick={triggerPendingOrder}
                disabled={isResetting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Trigger Pending Order (P2)
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
                    Approving...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Approve Checkpoint
                  </>
                )}
              </Button>

              <Button
                onClick={fixBalance}
                disabled={isResetting}
                variant="outline"
                className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Fix Balance (Recalculate)
              </Button>

              <div className="border-t border-slate-600 pt-4 mt-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Balance Adjustment
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={balanceAmount}
                      onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Amount"
                      className="bg-slate-700 border-slate-600 text-white w-28"
                    />
                    <span className="text-slate-400 text-sm">$</span>
                  </div>
                  
                  <Input
                    type="text"
                    value={balanceReason}
                    onChange={(e) => setBalanceReason(e.target.value)}
                    placeholder="Reason for adjustment (optional)"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  
                  <div className="flex space-x-2">
                    <Button
                      onClick={addBalance}
                      disabled={isResetting}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      {isResetting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-1" />
                          Add Balance
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={reduceBalance}
                      disabled={isResetting}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      {isResetting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Minus className="w-4 h-4 mr-1" />
                          Reduce Balance
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Training Analytics
              </Button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-green-400 text-sm font-medium">System Features:</p>
                  <ul className="text-green-300 text-xs space-y-1 mt-1">
                    <li>• Training accounts: 2-phase system (45/45 each)</li>
                    <li>• Combination products: Auto-trigger at tasks 19/24/31</li>
                    <li>• 6x profit system: Fixed for combination clearance</li>
                    <li>• Task pausing: During pending orders</li>
                    <li>• Withdrawal blocking: During training</li>
                    <li>• Referral tracking: Link accounts to users</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2 text-yellow-500" />
            Admin Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-yellow-400 mb-2">Training Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• Phase 1: Complete 45/45 tasks normally</li>
                <li>• Phase 2: Complete another 45/45 tasks</li>
                <li>• Auto-trigger at task 31 in Phase 2 ONLY</li>
                <li>• Negative balance until cleared</li>
                <li>• 6x profit added after clearing</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">Personal Account Flow:</h4>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 1% profit transfer after training (training earnings moved to personal account)</li>
                <li>• Withdrawal restrictions during training</li>
                <li>• Separate balance tracking</li>
                <li>• No combination products</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debug / Testing Section */}
      <Card className="bg-slate-900/50 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Debug & Testing Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              onClick={async () => {
                // Try to get the currently logged-in user with email
                let user = JSON.parse(localStorage.getItem('optimize_user') || '{}');
                let userEmail = user?.email;
                
                // If no email found, try training_account
                if (!userEmail) {
                  const trainingAccount = JSON.parse(localStorage.getItem('training_account') || '{}');
                  if (trainingAccount?.email) {
                    user = trainingAccount;
                    userEmail = trainingAccount.email;
                  }
                }
                
                // If still no email, try current_user
                if (!userEmail) {
                  const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
                  if (currentUser?.email) {
                    user = currentUser;
                    userEmail = currentUser.email;
                  }
                }
                
                // Try to find any training account with email
                if (!userEmail) {
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith('training_') && key.includes('@')) {
                      const account = JSON.parse(localStorage.getItem(key) || '{}');
                      if (account?.email) {
                        user = account;
                        userEmail = account.email;
                        break;
                      }
                    }
                  }
                }
                
                const currentBalance = user.balance || 1100;
                const triggerTask = Math.random() < 0.5 ? 31 : 32;
                
                user.has_pending_order = true;
                user.pending_amount = 210;
                user.trigger_task_number = triggerTask;
                // Subtract 210 from current balance (don't overwrite it!)
                user.balance = currentBalance - 210;
                user.profit_added = false;
                user.training_phase = 2;
                user.pending_product = {
                  name: `Premium Combination Product - Task ${triggerTask}`,
                  brand: 'Optimize',
                  price: 210,
                  category: 'Premium',
                  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'
                };
                
                // Save to ALL localStorage keys for consistency
                localStorage.setItem('optimize_user', JSON.stringify(user));
                localStorage.setItem('training_account', JSON.stringify(user));
                localStorage.setItem('current_user', JSON.stringify(user));
                
                // Save to email-specific keys
                if (userEmail) {
                  localStorage.setItem(`training_${userEmail}`, JSON.stringify(user));
                  localStorage.setItem(`optimize_user_${userEmail}`, JSON.stringify(user));
                }
                
                // ALSO sync to Supabase for cross-device persistence
                if (user.id && user.id !== 'local-admin') {
                  try {
                    await SupabaseService.syncUserBalance(user.id, user.balance, user.total_earned || 0);
                    console.log('[Simulate Pending] Balance synced to Supabase:', user.balance);
                  } catch (e) {
                    console.log('[Simulate Pending] Supabase sync failed (offline)');
                  }
                }
                
                alert(`Pending order simulated at Task ${triggerTask}!\n\nEmail: ${userEmail || 'Unknown'}\nPrevious Balance: $${currentBalance.toFixed(2)}\nPending Amount: -$210\nNew Balance: $${user.balance.toFixed(2)}\n\nGo to Tasks page to see the Combination Product!`);
              }}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Simulate Pending Order
            </Button>
            
            <Button
              variant="outline"
              className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              onClick={() => {
                // Clear pending order (admin action simulation)
                const user = JSON.parse(localStorage.getItem('optimize_user') || localStorage.getItem('training_account') || '{}');
                user.has_pending_order = false;
                user.pending_amount = 0;
                user.is_negative_balance = false;
                // Keep trigger_task_number and pending_product for claim
                localStorage.setItem('optimize_user', JSON.stringify(user));
                alert('Pending order cleared by admin!\n\nGo to Tasks page to see "Claim 6x Profit" modal.');
              }}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Simulate Admin Clear
            </Button>
            
            <Button
              variant="outline"
              className="bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              onClick={() => {
                // Reset everything
                const user = JSON.parse(localStorage.getItem('optimize_user') || localStorage.getItem('training_account') || '{}');
                user.has_pending_order = false;
                user.pending_amount = 0;
                user.trigger_task_number = null;
                user.balance = 1100;
                user.profit_added = false;
                user.pending_product = null;
                localStorage.setItem('optimize_user', JSON.stringify(user));
                alert('Reset complete!\n\nBalance: $1100\nNo pending orders.');
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Test State
            </Button>
          </div>
          
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400/80">
              <strong>Test Flow:</strong> 1) Click "Simulate Pending Order" → 2) Go to Tasks (see red modal) → 3) Click "Simulate Admin Clear" → 4) Go to Tasks (see green "Claim 6x Profit" modal) → 5) Click claim button → Profit added!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminControls;
