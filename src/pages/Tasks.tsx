import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Lock, 
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  Clock,
  Zap,
  Check,
  AlertTriangle,
  Star,
  CheckCircle,
  DollarSign,
  Headphones
} from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from 'sonner';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { user, tasks, completeTask, isLoading, walletState, refreshTasks, refreshUser } = useAppContext();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showCSSelection, setShowCSSelection] = useState(false);

  const isTraining = user?.account_type === 'training';
  const totalTasks = user?.total_tasks || 45;
  const tasksArray = tasks || [];
  const completedCount = tasksArray.filter(t => t.status === 'completed').length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 0 : 0;

  // Cache reset listener - watch for admin account resets
  // When tasks_completed or task_number resets to 0 or 1, clear all local component state
  useEffect(() => {
    if (!user) return;

    const tasksCompleted = user.tasks_completed || 0;
    const taskNumber = user.task_number || 1;

    // Detect if account was reset (tasks went from high number to 0/1)
    const wasReset = tasksCompleted === 0 || taskNumber === 1;

    if (wasReset) {
      console.log('[Tasks] Account reset detected - clearing local component cache', {
        tasksCompleted,
        taskNumber,
        accountType: user.account_type
      });

      // Clear all local state caches
      setSelectedTask(null);
      setFilter('all');
      setShowCSSelection(false);

      // Force refresh tasks and user data from server
      refreshTasks();
      refreshUser();
    }
  }, [user?.tasks_completed, user?.task_number]);

  // Determine task state strictly from database
  const tasksCompleted = user?.tasks_completed || 0;
  const isLockedAwaitingReset = user?.tasks_completed === 35;

  // For VIP1 personal accounts, handle 35/35 completion state
  // Rely primarily on user.tasks_completed from database, not local completedCount from tasks array
  // This ensures correct state even when tasks array is empty after customer service reset
  const isFirstSetComplete = !isTraining && user?.vip_level === 1 && user?.tasks_completed === 35;
  const isSecondSetComplete = !isTraining && user?.vip_level === 1 && user?.tasks_completed === 70;
  const totalReward = user?.total_earned || 0;

  // For VIP1 personal accounts, calculate current set display
  // Only switch to Set 2 when tasks_completed > 35 (after customer service reset)
  const currentSetDisplay = !isTraining && user?.vip_level === 1 && user?.tasks_completed > 35 ? 'Set 2' : 'Set 1';
  const currentSetCompleted = !isTraining && user?.vip_level === 1 && user?.tasks_completed > 35 
    ? Math.min(completedCount - 35, 35) 
    : completedCount;
  const currentSetTotal = 35;

  // For progress display, use actual completed count to prevent 0/35 when first set complete
  const displayCompletedCount = isFirstSetComplete ? 35 : currentSetCompleted;
  const displayProgressPercent = currentSetTotal > 0 ? (displayCompletedCount / currentSetTotal) * 100 : 0;

  // VIP1 commission rate: 0.5% per task, total $10.25 across 35 tasks = $0.292857... per task
  const VIP1_COMMISSION_RATE = 0.292857142857; // $10.25 / 35 tasks

  // Calculate task reward based on VIP1 commission rate if task.reward is 0
  const calculateTaskReward = (task: any) => {
    if (task.reward && task.reward > 0) return task.reward;
    // If reward is 0, use deterministic variance based on task_number for natural fluctuation
    // Range: 0.10 to 0.30, bouncing up and down
    const taskNumber = task.task_number;
    const hash = taskNumber * 7919; // Prime number for better distribution
    const variance = Math.sin(hash) * 0.5; // -0.5 to 0.5
    const baseRate = 0.20; // Midpoint
    const fluctuation = variance * 0.10; // ±0.10 variance
    const calculatedReward = Math.max(0.10, Math.min(0.30, baseRate + fluctuation));
    return calculatedReward;
  };

  const filteredTasks = tasksArray.filter(task => {
    if (filter === 'pending') return task.status === 'pending' || task.status === 'locked';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-emerald-400" />;
      case 'pending':
        return <Play className="w-6 h-6 text-amber-400" />;
      case 'locked':
        return <Lock className="w-6 h-6 text-slate-500" />;
      default:
        return <Circle className="w-6 h-6 text-slate-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer';
      case 'locked':
        return 'bg-slate-800/50 border-slate-700/50 opacity-60';
      default:
        return 'bg-slate-800/50 border-slate-700/50';
    }
  };

  const handleCompleteTaskDirect = async (task: any) => {
    if (task.status !== 'pending') return;
    
    // BLOCK task submission if pending order exists
    if (user?.has_pending_order) {
      toast.error('Tasks are locked! Please clear your pending combination order first. Contact customer service.', {
        duration: 5000,
      });
      return;
    }
    
    // BLOCK task submission if first set is complete (awaiting customer service reset)
    if (isFirstSetComplete) {
      toast.error('Account reset required! Please contact customer service to reset your account for the next set.', {
        duration: 5000,
      });
      return;
    }
    
    const success = await completeTask(task.task_number);
    if (success) {
      toast.success('Task completed!');
    }
  };

  const handleTaskClick = (task: any) => {
    if (task.status === 'pending') {
      setSelectedTask(task);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    
    // BLOCK task submission if pending order exists
    if (user?.has_pending_order) {
      toast.error('Tasks are locked! Please clear your pending combination order first. Contact customer service.', {
        duration: 5000,
      });
      return;
    }
    
    // BLOCK task submission if first set is complete (awaiting customer service reset)
    if (isFirstSetComplete) {
      toast.error('Account reset required! Please contact customer service to reset your account for the next set.', {
        duration: 5000,
      });
      return;
    }
    
    const success = await completeTask(selectedTask.task_number);
    if (success) {
      setSelectedTask(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
                <Target className="w-5 h-5 text-amber-400" />
                <span className="text-amber-200 font-semibold text-base">
                  {!isTraining && user?.vip_level === 1 
                    ? `${currentSetDisplay} (${displayCompletedCount}/${currentSetTotal})` 
                    : `${completedCount}/${totalTasks} Tasks`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VIP1 Completion Alert Banner */}
      {isFirstSetComplete && (
        <div className="relative p-6 bg-gradient-to-r from-emerald-600/20 via-green-600/15 to-teal-600/10 border border-emerald-500/20 rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
            <div
              className="absolute -right-20 top-0 w-72 h-72 rounded-full bg-green-500/10 blur-3xl animate-pulse"
              style={{ animationDuration: '6s' }}
            />
          </div>
          <div className="relative pr-16 z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">First Set Complete!</h3>
            </div>
            <p className="text-gray-300 text-sm font-medium mb-3">
              You have successfully completed the first set of 35/35 tasks. Please contact customer service to reset your personal account to continue to the next set.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign size={14} />
                <span className="font-semibold">Balance: ${walletState.available_balance.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400">
                <TrendingUp size={14} />
                <span className="font-semibold">Total Earned: ${totalReward.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCSSelection(true)}
            className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
            title="Contact Customer Service"
          >
            <Headphones size={20} className="text-white" />
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-slate-400 text-sm">Progress</span>
            </div>
            <p className="text-2xl font-bold text-white">{Math.round(displayProgressPercent)}%</p>
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${displayProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-slate-400 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{displayCompletedCount}</p>
            <p className="text-sm text-emerald-400 font-medium">tasks done</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-slate-400 text-sm">Pending</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {tasksArray.filter(t => t.status === 'pending').length}
            </p>
            <p className="text-sm text-amber-400 font-medium">tasks waiting</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-slate-400 text-sm">Earnings</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${user?.total_earned?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-purple-400">total earned</p>
          </div>
        </div>

        {/* Pending Order Warning Banner */}
        {user?.has_pending_order && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-red-400 font-semibold">Combination Product Detected!</p>
                <p className="text-red-300/70 text-sm">Tasks are locked. Balance: ${user?.balance?.toFixed(2)}. Contact customer service to clear pending order.</p>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2.5 rounded-xl font-medium capitalize transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task Grid - Bigger cards like Daily Bonus */}
        {isLockedAwaitingReset ? (
          <div className="locked-message p-8 bg-gradient-to-br from-emerald-600/20 via-green-600/15 to-teal-600/10 border border-emerald-500/20 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <h3 className="text-2xl font-bold text-white">First set of 35 tasks completed!</h3>
            </div>
            <p className="text-gray-300 text-lg">Contact customer service to continue to the next set.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task)}
              className={`relative bg-gradient-to-br from-slate-900/80 to-slate-950/80 border rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                task.status === 'completed' 
                  ? 'border-emerald-500/30 hover:shadow-emerald-500/10' 
                  : task.status === 'pending'
                  ? 'border-amber-500/30 hover:shadow-amber-500/10 cursor-pointer'
                  : 'border-slate-700/50 opacity-80'
              }`}
            >
              {/* Header with status badge */}
              <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-emerald-500/20' : 
                    task.status === 'pending' ? 'bg-amber-500/20' : 'bg-slate-800'
                  }`}>
                    {getTaskIcon(task.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{task.title || `Task ${task.task_number}`}</h3>
                      {task.status === 'pending' && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-full">2X REWARD</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">Complete to earn rewards</p>
                  </div>
                </div>
                {task.status === 'completed' && (
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-full">
                    +${calculateTaskReward(task).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Product showcase - 2 column layout */}
              <div className="grid md:grid-cols-2 gap-0">
                {/* Product Image Area */}
                <div className="relative p-6 md:p-8 flex items-center justify-center min-h-[280px] bg-gradient-to-br from-amber-500/5 to-indigo-500/5">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-indigo-500/5 rounded-2xl blur-xl" />
                  
                  {/* Placeholder image or icon */}
                  <div className="relative">
                    <div className="w-full max-w-[220px] h-[220px] rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-2xl shadow-black/30">
                      {task.status === 'completed' ? (
                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                      ) : task.status === 'pending' ? (
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Play className="w-10 h-10 text-amber-400" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center">
                          <Lock className="w-10 h-10 text-slate-500" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full">
                    <span className="text-xs font-semibold text-amber-300">Premium Task</span>
                  </div>

                  {/* VIP badge */}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/30 rounded-full">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles size={11} /> VIP TASK
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <div>
                    <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Task #{task.task_number}</p>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                      {task.title || `Premium Review Task`}
                    </h2>

                    {task.description && (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-3">
                        {task.description}
                      </p>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">5.0 (Premium)</span>
                    </div>

                    {/* Price display */}
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-bold text-white">${calculateTaskReward(task).toFixed(2)}</span>
                      <span className="text-sm text-slate-500 line-through">${(calculateTaskReward(task) * 1.4).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Reward info box */}
                  <div className="p-4 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        <span className="text-sm font-semibold text-white">Task Reward</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-400">+${calculateTaskReward(task).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Zap size={12} className="text-amber-400" />
                      <span>2X multiplier applied — Complete task now</span>
                    </div>
                  </div>

                  {/* Action button */}
                  {task.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteTaskDirect(task);
                      }}
                      disabled={isLoading || user?.has_pending_order || isFirstSetComplete}
                      className={`w-full py-4 text-white font-bold rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-3 text-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] group ${
                        isFirstSetComplete
                          ? 'bg-slate-700 text-slate-400'
                          : user?.has_pending_order 
                            ? 'bg-red-500/20 text-red-400' 
                            : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:via-orange-500 hover:to-amber-500 hover:shadow-amber-500/40'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : isFirstSetComplete ? (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Awaiting Account Reset</span>
                        </>
                      ) : user?.has_pending_order ? (
                        <>
                          <Lock className="w-5 h-5" />
                          <span>Locked - Pending Order</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>Complete Task</span>
                          <span className="ml-2 px-3 py-1 bg-white/15 rounded-full text-sm">+${calculateTaskReward(task).toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  )}

                  {task.status === 'completed' && (
                    <div className="flex items-center justify-center gap-2 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      <span className="text-emerald-400 font-bold text-lg">Task Completed</span>
                    </div>
                  )}

                  {task.status === 'locked' && (
                    <div className="flex items-center justify-center gap-2 py-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                      <Lock className="w-6 h-6 text-slate-500" />
                      <span className="text-slate-500 font-bold text-lg">Task Locked</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
            <p className="text-slate-400">
              {filter === 'completed' 
                ? "You haven't completed any tasks yet. Get started!" 
                : filter === 'pending'
                ? "No pending tasks available. Great job!"
                : "No tasks available at the moment."}
            </p>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <Play className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <p className="text-slate-500 text-sm">Task {selectedTask.task_number}</p>
                <h3 className="text-xl font-bold text-white">
                  {selectedTask.title || `Task ${selectedTask.task_number}`}
                </h3>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-800/50 rounded-xl">
                <p className="text-slate-300 text-sm leading-relaxed">
                  {selectedTask.description || 'Complete this task to earn rewards and progress in your training.'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                <span className="text-slate-400 text-sm">Reward</span>
                <span className="text-amber-400 font-bold text-lg">
                  ${calculateTaskReward(selectedTask).toFixed(2)}
                </span>
              </div>
              
              {/* Pending Order Warning in Modal */}
              {user?.has_pending_order && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 font-semibold text-sm">Tasks Locked - Pending Order</p>
                  </div>
                  <p className="text-red-300/70 text-xs mt-1">
                    Contact customer service to clear the combination product before continuing.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTask}
                disabled={isLoading || user?.has_pending_order}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  user?.has_pending_order 
                    ? 'bg-red-500/20 text-red-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : user?.has_pending_order ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Locked
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
