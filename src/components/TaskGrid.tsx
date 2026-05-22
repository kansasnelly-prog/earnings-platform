import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useCSNotification } from '@/contexts/CSNotificationContext';
import { CheckCircle, Lock, Zap, Loader2, DollarSign, Award, Star, ShoppingBag, Send, Package, Headphones, AlertTriangle, MessageCircle, ArrowRight, Plus, Sparkles, Crown, GraduationCap, Trophy, Badge } from 'lucide-react';
import DailyBonus from './DailyBonus';
import Phase2Checkpoint from './Phase2Checkpoint';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ProductCatalogService, { Product } from '@/services/productCatalogService';
import { SupabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';



// Product catalogs are now managed by ProductCatalogService
// Training: 45 products | Personal: 35 products | Total: 80 products

// Animated Preloader Component (2.5-3 seconds)
const ProductPreloader: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800); // 2.8 seconds for nice animation
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Animated loading rings */}
      <div className="relative w-28 h-28 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.2s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-pink-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.4s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center backdrop-blur-sm">
            <Package size={24} className="text-indigo-400 animate-pulse" />
          </div>
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse', animationDelay: '0.5s' }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-400 rounded-full" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full" />
        </div>
      </div>
      
      {/* Loading text with shimmer */}
      <div className="relative overflow-hidden">
        <p className="text-sm font-medium text-gray-400">Loading next product...</p>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>
      
      {/* Loading bar */}
      <div className="w-48 h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar" />
      </div>
    </div>
  );
};

// Simple Product Card - Clean compact design
const SimpleProductCard: React.FC<{
  product: Product;
  reward: number;
  taskNumber: number;
  totalTasks: number;
  onSubmit: (e?: React.MouseEvent) => void;
  isSubmitting: boolean;
  isTraining: boolean;
  hasPendingOrder?: boolean;
  vipLevel?: number;
}> = ({ product, reward, taskNumber, totalTasks, onSubmit, isSubmitting, isTraining, hasPendingOrder, vipLevel = 1 }) => {
  const clickLockRef = useRef(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const handleSingleSubmit = (e: React.PointerEvent) => {
    e.preventDefault?.();
    e.stopPropagation?.();

    if (clickLockRef.current || isSubmitting) {
      return;
    }

    clickLockRef.current = true;
    onSubmit(e as any);

    setTimeout(() => {
      clickLockRef.current = false;
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-3xl overflow-hidden p-6 text-center shadow-2xl">
        <div className="absolute top-3 right-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Crown className="w-3 h-3" />
            {`VIP${vipLevel}`}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-center p-6 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl">
          {imageLoadFailed ? (
            <div className="flex items-center justify-center">
              <Package className="w-16 h-16 text-indigo-300/80" />
            </div>
          ) : (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain max-h-[500px]"
              crossOrigin="anonymous"
              onError={() => setImageLoadFailed(true)}
            />
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-1">{product.name}</h3>
        <p className="text-sm text-gray-400 mb-4">{product.brand} • {product.category}</p>

        <div className={`${hasPendingOrder ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl p-3 mb-4`}>
          <p className="text-sm text-gray-400 mb-1">{hasPendingOrder ? 'Pending Order Amount' : 'Commission Reward'}</p>
          <div className="flex items-center justify-center gap-1">
            <DollarSign className={`w-5 h-5 ${hasPendingOrder ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className={`text-2xl font-bold ${hasPendingOrder ? 'text-red-400' : 'text-emerald-400'}`}>{hasPendingOrder ? product.price?.toFixed(2) || reward.toFixed(2) : reward.toFixed(2)}</span>
          </div>
        </div>

        {hasPendingOrder ? (
          <div className="w-full py-4 font-bold rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-600 text-white flex items-center justify-center gap-2 text-lg cursor-not-allowed">
            <AlertTriangle size={20} style={{ pointerEvents: 'none' }} />
            <span style={{ pointerEvents: 'none' }}>Pending Order - Contact Support</span>
          </div>
        ) : (
          <button 
            type="button"
            onPointerUp={handleSingleSubmit}
            disabled={isSubmitting} 
            className="w-full py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 text-lg disabled:opacity-60 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white"
          >
            {isSubmitting ? <><Loader2 size={20} className="animate-spin" style={{ pointerEvents: 'none' }} /><span style={{ pointerEvents: 'none' }}>Submitting Task...</span></> : <><Send size={20} style={{ pointerEvents: 'none' }} /><span style={{ pointerEvents: 'none' }}>Submit Task</span><span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-sm" style={{ pointerEvents: 'none' }}>+${reward.toFixed(2)}</span></>}
          </button>
        )}
      </div>
    </div>
  );
};

// Combination Product Card - Premium card showing 2 products side by side
const CombinationProductCard: React.FC<{
  product1: Product;
  product2: Product;
  combinedPrice: number;
  taskNumber: number;
  userBalance: number;
  onContactSupport: () => void;
}> = ({ product1, product2, combinedPrice, taskNumber, userBalance, onContactSupport }) => {
  const negativeBalance = userBalance - combinedPrice;
  const [image1Failed, setImage1Failed] = useState(false);
  const [image2Failed, setImage2Failed] = useState(false);
  
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-900/40 border-2 border-purple-500/40 rounded-3xl overflow-hidden p-8 text-center shadow-2xl shadow-purple-500/20 animate-pulse-slow">
        {/* Premium Badge */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black text-xs font-extrabold px-6 py-2 rounded-b-xl flex items-center gap-2 shadow-lg shadow-amber-500/30 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Premium Combination
          </div>
        </div>

        {/* Pending Status Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
            Pending Order
          </div>
        </div>

        {/* Title */}
        <div className="mt-6 mb-6">
          <h2 className="text-2xl font-black text-white mb-1 tracking-tight">
            COMBINATION PRODUCT
          </h2>
          <p className="text-sm text-purple-300">Two Premium Items • One Special Order</p>
        </div>

        {/* Two Products Side by Side */}
        <div className="flex gap-4 mb-6">
          {/* Product 1 */}
          <div className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 group">
            <div className="relative">
              {image1Failed ? (
                <div className="w-full h-32 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent">
                  <Package className="w-8 h-8 text-purple-300/80" />
                </div>
              ) : (
                <img
                  src={product1.image}
                  alt={product1.name}
                  className="w-full h-32 object-contain rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent group-hover:brightness-110 transition-all"
                  crossOrigin="anonymous"
                  onError={() => setImage1Failed(true)}
                />
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                1
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 truncate">{product1.name}</h4>
            <p className="text-xs text-gray-400">{product1.brand}</p>
          </div>

          {/* Plus Icon */}
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Product 2 */}
          <div className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] rounded-2xl p-4 transform hover:scale-105 transition-all duration-300 group">
            <div className="relative">
              {image2Failed ? (
                <div className="w-full h-32 flex items-center justify-center rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent">
                  <Package className="w-8 h-8 text-purple-300/80" />
                </div>
              ) : (
                <img
                  src={product2.image}
                  alt={product2.name}
                  className="w-full h-32 object-contain rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent group-hover:brightness-110 transition-all"
                  crossOrigin="anonymous"
                  onError={() => setImage2Failed(true)}
                />
              )}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                2
              </div>
            </div>
            <h4 className="text-sm font-bold text-white mt-3 truncate">{product2.name}</h4>
            <p className="text-xs text-gray-400">{product2.brand}</p>
          </div>
        </div>

        {/* Combined Price */}
        <div className="bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 border border-purple-500/30 rounded-2xl p-4 mb-4">
          <p className="text-sm text-purple-300 mb-1">Combined Order Value</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-6 h-6 text-amber-400" />
            <span className="text-3xl font-black text-white">{combinedPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-400 mb-1">Current Balance</p>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5 text-red-400" />
            <span className="text-2xl font-bold text-red-400">{negativeBalance.toFixed(2)}</span>
          </div>
          <p className="text-xs text-red-300/70 mt-1">Insufficient balance for this order</p>
        </div>

        {/* Warning Message */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 text-amber-300">
            <Lock className="w-4 h-4" />
            <span className="text-sm">Tasks locked until order is cleared by customer service</span>
          </div>
        </div>

        {/* Contact Support Button */}
        <button 
          onClick={onContactSupport}
          className="w-full py-4 font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 text-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Headphones className="w-5 h-5" />
          <span>Contact Customer Service</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const SuccessMessage: React.FC<{ reward: number; onNext: () => void }> = ({ reward, onNext }) => {
  useEffect(() => {
    const timer = setTimeout(onNext, 1500);
    return () => clearTimeout(timer);
  }, [onNext]);
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle size={48} className="text-emerald-400" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Task Complete!</h3>
      <div className="flex items-center gap-1 text-emerald-400">
        <DollarSign size={18} />
        <span className="text-lg font-bold">+${reward.toFixed(2)} added</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">Loading next product...</p>
    </div>
  );
};

const ProgressTracker: React.FC<{ tasks: any[]; currentTask: number; productCatalog: any[] }> = ({ tasks: tasksProp, currentTask, productCatalog: catalogProp }) => {
  const tasks = tasksProp || [];
  const productCatalog = catalogProp || [];
  const safeCatalog = Array.isArray(productCatalog) ? productCatalog : [];
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-task="${currentTask}"]`);
      if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [currentTask]);
  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide px-1">
        {tasks.map((task: any) => {
          const product = (safeCatalog || []).length > 0 
            ? safeCatalog[(task.task_number - 1) % safeCatalog.length]
            : { image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', name: 'iPhone X' };
          const isActive = task.task_number === currentTask;
          const isCompleted = task.status === 'completed';
          const isPending = task.status === 'pending';
          return (
            <div key={task.task_number} data-task={task.task_number} className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all duration-300 ${isActive ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-110' : isCompleted ? 'border-emerald-500/50 opacity-80' : isPending ? 'border-indigo-500/30' : 'border-white/[0.06] opacity-30'}`}>
              <img src={product?.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              {isCompleted && <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center"><CheckCircle size={14} className="text-white" /></div>}
              {!isCompleted && !isPending && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Lock size={10} className="text-gray-400" /></div>}
              {isActive && <div className="absolute inset-0 border-2 border-indigo-400 rounded-md animate-pulse" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TaskGrid: React.FC = () => {
  const { user, tasks, refreshTasks, refreshUser, completeTask, isLoading } = useAppContext();
  const { unreadCount } = useCSNotification();
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedReward, setCompletedReward] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [pendingCompletionTask, setPendingCompletionTask] = useState<number | null>(null);
  const [productCatalog, setProductCatalog] = useState<Product[]>([]);
  const [showCombinationModal, setShowCombinationModal] = useState(true);
  const [showClaimProfitModal, setShowClaimProfitModal] = useState(true);
  const [showSupportOptions, setShowSupportOptions] = useState(false);
  const [showTrainingShowroomModal, setShowTrainingShowroomModal] = useState(false);
  const [previewImageFailed, setPreviewImageFailed] = useState(false);
  const [optimisticTaskNumber, setOptimisticTaskNumber] = useState<number | null>(null);
  const [phase2Product1Failed, setPhase2Product1Failed] = useState(false);
  const [phase2Product2Failed, setPhase2Product2Failed] = useState(false);
  
  // Hard lock to prevent duplicate submissions across re-renders
  const submissionLockRef = useRef(false);
  
  // Phase 1 lock and Phase 2 checkpoint modals for VIP2
  const [showPhase1LockModal, setShowPhase1LockModal] = useState(false);
  const [showPhase2CheckpointModal, setShowPhase2CheckpointModal] = useState(false);
  
  // Personal Day 2 checkpoint modal
  const [showPersonalDay2CheckpointModal, setShowPersonalDay2CheckpointModal] = useState(false);
  
  // Two-set structure loading state
  const [isTransitioningToSet2, setIsTransitioningToSet2] = useState(false);
  const [currentTaskSet, setCurrentTaskSet] = useState<number>(1);

  // Sync current task set from user data
  useEffect(() => {
    if (user?.current_task_set) {
      setCurrentTaskSet(user.current_task_set);
    }
  }, [user?.current_task_set]);

  // Track previous task number to detect actual admin resets (high -> low drop)
  const previousTaskNumberRef = useRef<number | null>(null);

  // Cache reset listener - watch for admin account resets
  // Only clear cache if task_number specifically DROPS from a high number to 0 or 1 (actual admin reset)
  useEffect(() => {
    if (!user) return;

    const tasksCompleted = user.tasks_completed || 0;
    const taskNumber = user.task_number || 1;
    const previousTaskNumber = previousTaskNumberRef.current;

    // Only detect reset if:
    // 1. Current task_number is 0 or 1 (reset state)
    // 2. Previous task_number was > 5 (was making progress)
    // 3. This indicates a DROP from high to low (admin reset action)
    const wasReset = (taskNumber === 0 || taskNumber === 1) && 
                     previousTaskNumber !== null && 
                     previousTaskNumber > 5;

    if (wasReset) {
      console.log('[TaskGrid] Account reset detected (task number dropped from', previousTaskNumber, 'to', taskNumber, ') - clearing local component cache', {
        tasksCompleted,
        taskNumber,
        previousTaskNumber,
        accountType: user.account_type
      });

      // Clear all local state caches
      setCompletedCount(0);
      setShowPersonalDay2CheckpointModal(false);
      setShowSuccess(false);
      setCompletedReward(0);
      setIsLoadingProduct(true);
      setPendingCompletionTask(null);
      setProductCatalog([]);
      setIsTransitioningToSet2(false);
      setCurrentTaskSet(1);
      setShowPhase1LockModal(false);
      setShowPhase2CheckpointModal(false);
      setShowPersonalDay2CheckpointModal(false);

      // Force refresh tasks and user data from server (background, non-blocking)
      refreshTasks().catch(err => console.error('[TaskGrid] Background refreshTasks error on reset:', err));
      refreshUser().catch(err => console.error('[TaskGrid] Background refreshUser error on reset:', err));
    }

    // Update ref for next comparison
    previousTaskNumberRef.current = taskNumber;
  }, [user?.tasks_completed, user?.task_number]);

  // Load appropriate product catalog from Supabase based on account type
  useEffect(() => {
    // SAFETY CHECK: Wait for valid user context before loading products
    if (!user || !user.id) {
      console.log('[ProductCatalog] Waiting for valid user context before loading products...');
      return;
    }

    const loadProducts = async () => {
      try {
        const isTraining = user?.account_type === 'training';
        console.log('[ProductCatalog] Loading products from Supabase for account type:', user?.account_type);
        
        const catalog = isTraining 
          ? await ProductCatalogService.getTrainingProducts()
          : await ProductCatalogService.getPersonalProducts();
        
        setProductCatalog(catalog);
        console.log(`[ProductCatalog] Loaded ${catalog.length} ${isTraining ? 'training' : 'personal'} products from Supabase`);
      } catch (error) {
        console.error('[ProductCatalog] Error loading products:', error);
        // Fall back to defaults if Supabase fails
        const isTraining = user?.account_type === 'training';
        const fallback = isTraining 
          ? ProductCatalogService.getProductForTask(1, 'training')
          : ProductCatalogService.getProductForTask(1, 'personal');
        console.log('[ProductCatalog] Using fallback product');
      }
    };

    loadProducts();

    // Subscribe to realtime product updates
    const isTraining = user?.account_type === 'training';
    if (isTraining) {
      ProductCatalogService.subscribeToTrainingProducts((products) => {
        console.log('[ProductCatalog] Training products updated via realtime:', products.length);
        setProductCatalog(products);
      });
    } else {
      ProductCatalogService.subscribeToPersonalProducts((products) => {
        console.log('[ProductCatalog] Personal products updated via realtime:', products.length);
        setProductCatalog(products);
      });
    }

    // Cleanup subscriptions on unmount or account type change
    return () => {
      ProductCatalogService.unsubscribeFromTrainingProducts();
      ProductCatalogService.unsubscribeFromPersonalProducts();
    };
  }, [user?.id, user?.account_type]);

  // Subscribe to checkpoint changes for realtime updates when admin approves
  // ONLY in Phase 2 - Phase 1 has no checkpoints
  useEffect(() => {
    if (!user?.id) return;
    
    // Only subscribe to checkpoint changes in Phase 2
    const isPhase2 = Number(user?.training_phase) === 2;
    const userId = user.id; // Capture user.id in local variable to avoid scope issues
    const channel = supabase
      .channel('checkpoint_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'phase2_checkpoints',
          filter: `auth_user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('[Checkpoint User] Checkpoint change detected:', payload.eventType, payload.new);
          
          // Refresh user data to get updated checkpoint state
          const updatedCheckpoint = payload.new as any;
          if (updatedCheckpoint?.status === 'approved') {
            console.log('[Checkpoint User] approved checkpoint detected via realtime');
          }
          
          // Trigger a user refresh to get latest checkpoint data
          // This will update the UI to show/hide checkpoint modal or submit button
          window.dispatchEvent(new CustomEvent('refresh_user_checkpoint', { 
            detail: { checkpointId: updatedCheckpoint?.id, status: updatedCheckpoint?.status }
          }));
        }
      )
      .subscribe((status) => {
        // Subscription status logged only on error
      });
    
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, user?.training_phase]);

  // Subscribe to personal Day 2 checkpoint changes for realtime updates when admin approves
  useEffect(() => {
    if (!user?.id) return;
    
    // Only subscribe to personal Day 2 checkpoint changes
    const isPersonal = user?.account_type === 'personal';
    const personalCycle = user?.personal_cycle || 1;
    const userId = user.id; // Capture user.id in local variable to avoid scope issues
    
    if (isPersonal && personalCycle === 2 && userId) {
      const channelName = `personal_day2_checkpoint_${userId}`; // Unique channel name per user
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'personal_day2_checkpoints',
            filter: `auth_user_id=eq.${userId}`
          },
          async (payload) => {
            console.log('[PersonalDay2Checkpoint User] Checkpoint change detected:', payload.eventType, payload.new);
            
            // Refresh user data to get updated checkpoint state
            const updatedCheckpoint = payload.new as any;
            if (updatedCheckpoint?.status === 'approved') {
              console.log('[PersonalDay2Checkpoint User] approved checkpoint detected via realtime');
            }
            
            // Trigger a user refresh to get latest checkpoint data
            window.dispatchEvent(new CustomEvent('refresh_user_checkpoint', { 
              detail: { checkpointId: updatedCheckpoint?.id, status: updatedCheckpoint?.status }
            }));
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[PersonalDay2Checkpoint User] Realtime subscription established');
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error('[PersonalDay2Checkpoint User] Realtime subscription error:', status);
          }
        });
      
      return () => {
        console.log('[PersonalDay2Checkpoint User] Cleaning up realtime subscription');
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, user?.account_type, user?.personal_cycle]);

  // Load tasks only once on mount - avoid dependency on refreshTasks which changes when user changes
  const dataLoaded = useRef(false);
  useEffect(() => {
    // SAFETY CHECK: Wait for valid user context before fetching tasks
    if (!user || !user.id) {
      console.log('[TaskGrid] Waiting for valid user context before fetching tasks...');
      return;
    }
    
    if (dataLoaded.current) return;
    
    // Calling refreshTasks once on mount
    const loadTasks = async () => {
      try {
        console.log('[TaskGrid] Fetching tasks for user:', user.id);
        await refreshTasks();
        dataLoaded.current = true;
      } catch (error) {
        console.error('[TaskGrid] Error in refreshTasks:', error);
      } finally {
        // refreshTasks completed
      }
    };
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const safeTasks = tasks || [];
  const calculatedCompletedCount = safeTasks.filter(t => t.status === 'completed').length;
  
  // Define isTraining first since other variables depend on it
  const isTraining = user?.account_type === 'training';
  
  // For training accounts, use user.task_number from Supabase directly (source of truth)
  // task_number = next task to complete, so completed = task_number - 1
  // Use optimistic task number if available (updated immediately after submission)
  const trainingCompletedCount = isTraining ? Math.max(0, (optimisticTaskNumber || user?.task_number || 1) - 1) : 0;

  // For training accounts, use user.task_number from Supabase directly (source of truth)
  // For personal accounts, derive from completed tasks count (completed + 1 = current task)
  // Use optimistic task number if available (updated immediately after submission)
  const currentTaskNumber = isTraining
    ? (optimisticTaskNumber || user?.task_number || 1)
    : Math.max(1, calculatedCompletedCount + 1);
  const pendingTask = safeTasks.find(t => t.task_number === currentTaskNumber) || {
    id: `task_${currentTaskNumber}`,
    task_number: currentTaskNumber,
    status: 'pending' as const,
    reward: 0,
    title: 'Current Task',
    description: `Task ${currentTaskNumber}`,
    user_id: user?.id || '',
    created_at: new Date().toISOString(),
    completed_at: null,
    task_set: 0
  };
  const isTasksLoading = isLoading || (safeTasks.length === 0 && !isTraining);
  
  // Use current task number to calculate completed count for display
  // This ensures the label is always in sync with the active task being displayed
  // If user is on task 8, they've completed 7 tasks, so display "7/35 completed"
  const displayCompletedCount = Math.max(0, currentTaskNumber - 1);
  
  // Reset loading state when pending task changes
  // Also clear optimistic task number when user data refreshes
  useEffect(() => {
    if (!user) return;
    
    if (pendingTask) {
      setIsLoadingProduct(true);
    }
    // Clear optimistic task number when actual user data is available
    // Only clear if the actual task_number matches or exceeds the optimistic number
    if (user.task_number && optimisticTaskNumber && user.task_number >= optimisticTaskNumber) {
      setOptimisticTaskNumber(null);
    }
  }, [pendingTask?.task_number, user?.task_number, optimisticTaskNumber]);
  
  // Reset modal visibility when component mounts (so modal shows again if pending order exists)
  useEffect(() => {
    if (user?.has_pending_order) {
      setShowCombinationModal(true);
    }
  }, [user?.has_pending_order]);

  // Show personal Day 2 checkpoint modal when checkpoint is triggered
  useEffect(() => {
    const isPersonal = user?.account_type === 'personal';
    const personalCycle = user?.personal_cycle || 1;
    const checkpointStatus = user?.personal_day2_checkpoint?.status;
    
    if (isPersonal && personalCycle === 2) {
      if (checkpointStatus === 'pending_review') {
        setShowPersonalDay2CheckpointModal(true);
      } else if (checkpointStatus === 'rejected') {
        // Show rejected state message and close modal
        setShowPersonalDay2CheckpointModal(false);
        console.log('[PersonalDay2Checkpoint] Checkpoint rejected, showing error message');
      } else if (checkpointStatus === 'completed' || checkpointStatus === 'submitted') {
        // Close modal when checkpoint is completed or submitted
        setShowPersonalDay2CheckpointModal(false);
      } else if (checkpointStatus === 'approved') {
        // Close modal when approved (user will see submit UI instead)
        setShowPersonalDay2CheckpointModal(false);
      }
    }
  }, [user?.account_type, user?.personal_cycle, user?.personal_day2_checkpoint?.status]);
  
  // Use user.total_earned from database as the single source of truth
  const totalReward = user?.total_earned || 0;
  // Support Phase 1 and Phase 2 for both account types
  // Use total_tasks from database as source of truth
  const totalTasks = user?.total_tasks || 45;

const progress = totalTasks > 0
  ? (displayCompletedCount / totalTasks) * 100
  : 0;

const allComplete = displayCompletedCount === totalTasks;

  // Personal accounts must complete training before accessing task submissions
  // Check training_completed field - defaults to FALSE for new accounts
  const isPersonal = user?.account_type === 'personal';
  const trainingCompleted = user?.training_completed === true;
  const needsTraining = isPersonal && !trainingCompleted; // Lock personal accounts until training completes
  const canSubmitTasks = !needsTraining; // Can submit if not locked

  // SAFETY CHECK: Separate account flows - handle new/reset accounts vs active accounts
  const isNewAccount = !user || !user?.tasks_completed;
  
  // Early return for new accounts to prevent rendering errors
  if (isNewAccount && !user) {
    console.log('[TaskGrid] User object not available, showing loading state');
    return (
      <div className="text-center py-12">
        <Loader2 size={40} className="text-indigo-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-bold text-white mb-2">Loading User Data...</h3>
        <p className="text-gray-400">Please wait while we fetch your account information.</p>
      </div>
    );
  }

  // TOP-LEVEL SAFETY: Ensure user is defined before rendering main layout
  if (!user) {
    console.log('[TaskGrid] User object not available in main render, showing loading state');
    return (
      <div className="text-center py-12">
        <Loader2 size={40} className="text-indigo-500 mx-auto mb-4 animate-spin" />
        <h3 className="text-xl font-bold text-white mb-2">Loading User Data...</h3>
        <p className="text-gray-400">Please wait while we fetch your account information.</p>
      </div>
    );
  }

  const handleSubmit = async (e?: React.MouseEvent) => {
    // STOP EVENT BUBBLING: Prevent duplicate triggers from parent containers
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    // HARD LOCK: Prevent duplicate submissions across re-renders
    if (submissionLockRef.current) {
      return;
    }
    
    // STATE CHECK: Also check isSubmitting state
    if (!pendingTask || isSubmitting) {
      return;
    }

    // SAFETY CHECK: Ensure user object exists before proceeding
    if (!user) {
      console.error('[TaskGrid] User object not available, cannot submit task');
      toast({
        title: 'Error',
        description: 'User data not available. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }
    
    // Set lock immediately to prevent any further submissions
    submissionLockRef.current = true;
    setIsSubmitting(true);
    setPendingCompletionTask(pendingTask.task_number);
    
    // TIMEOUT PROTECTION: Prevent infinite processing
    const timeoutId = setTimeout(() => {
      // Only reset state if submission is still in progress (check the lock)
      if (submissionLockRef.current) {
        console.error('[TaskGrid] Task submission timeout - resetting state');
        setIsSubmitting(false);
        submissionLockRef.current = false;
        setPendingCompletionTask(null);
        toast({
          title: 'Submission Timeout',
          description: 'Task submission took too long. Please refresh the page and try again.',
          variant: 'destructive',
        });
      }
    }, 120000); // 120 second timeout (increased from 30s to handle slow network responses)
    
    try {
      // Personal VIP1 accounts now have normal workflow - no training lock blocking
      // Training lock logic removed - personal accounts can complete tasks immediately
    
      // Only check for checkpoint blocking in Phase 2
      const isPhase2 = Number(user?.training_phase) === 2;
      
      // BLOCK task submission if Phase 2 checkpoint is pending review (Phase 2 only)
      if (isPhase2 && user?.training_phase_2_checkpoint?.status === 'pending_review') {
        clearTimeout(timeoutId);
        toast({
          title: 'Checkpoint Review Required',
          description: 'Your account is pending admin review. Contact customer service to continue.',
          variant: 'destructive',
        });
        setShowCheckpointModal(true);
        setIsSubmitting(false);
        submissionLockRef.current = false;
        return;
      }
      
      // NOTE: We do NOT block task submission when checkpoint is approved.
      // Instead, user sees a "Submit Checkpoint Product" button on their task page.
      // They can close the modal and see the submit button on their task page.
      
      // BLOCK task submission if pending order exists
      if (user?.has_pending_order) {
        clearTimeout(timeoutId);
        toast({
          title: 'Tasks Locked',
          description: 'Please clear your pending combination order first. Contact customer service.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        submissionLockRef.current = false;
        return;
      }
      
      // ALLOW normal task submission when checkpoint is completed or doesn't exist
      // Note: We only block when checkpoint is pending_review, not when completed
      // Users should be able to submit normal tasks 32-45 after checkpoint completion
      
      const result = await completeTask(pendingTask.task_number);

      // Clear timeout since completeTask completed
      clearTimeout(timeoutId);

      // Clear loading state immediately after completeTask returns
      setIsSubmitting(false);
      submissionLockRef.current = false;

      if (result.success) {
        setCompletedReward(result.reward || pendingTask.reward);
        setCompletedCount(prev => prev + 1);
        setShowSuccess(true);

        // CRITICAL: For training accounts, optimistically update task_number locally to advance UI immediately
        // This ensures the UI shows the next task without waiting for database refresh
        if (isTraining && user) {
          const nextTaskNumber = (user.task_number || 1) + 1;
          setOptimisticTaskNumber(nextTaskNumber);
          console.log('[TaskGrid] Optimistically updated task number to:', nextTaskNumber);
        }

        // Refresh tasks and user data asynchronously in background
        // This ensures the task status is updated in the tasks array for the ProgressTracker
        refreshTasks().catch(err => console.error('[TaskGrid] Background refreshTasks error:', err));
        refreshUser().then(() => {
          // Clear optimistic task number once actual data is refreshed
          setOptimisticTaskNumber(null);
        }).catch(err => console.error('[TaskGrid] Background refreshUser error:', err));
      
        // Handle Phase 1 lock for VIP2 (45/45)
        if (result.phase1Locked) {
          setShowPhase1LockModal(true);
          return; // Don't auto-advance when Phase 1 is locked
        }
      
        // Handle Phase 2 checkpoint at task #30 for VIP2
        if (result.phase2Checkpoint) {
          setShowPhase2CheckpointModal(true);
          return; // Don't auto-advance when Phase 2 checkpoint is triggered
        }
      
        // Handle auto-reset from Set 1 to Set 2 (VIP1 only)
        if (result.autoReset) {
          setIsTransitioningToSet2(true);
          
          // Refresh user data to get updated set state
          refreshUser().catch(err => console.error('[TaskGrid] Background refreshUser error:', err));
          
          // Show loading state for 3 seconds, then refresh tasks
          setTimeout(async () => {
            await refreshTasks();
            setCurrentTaskSet(2);
            setIsTransitioningToSet2(false);
            setShowSuccess(false);
            setIsLoadingProduct(true);
            toast({
              title: 'Set 1 Completed!',
              description: 'Congratulations! You have completed Set 1. Set 2 is now unlocked.',
            });
          }, 3000);
          
          return; // Don't auto-advance to next task during transition
        }
      
        // Auto-advance to next task immediately after success message
        // The SuccessMessage component has its own 1.5s timer
        // No additional delay needed here
      } else {
        setPendingCompletionTask(null);
      }
    } catch (error) {
      console.error('[TaskGrid Submit] Exception during task submission:', error);
      clearTimeout(timeoutId); // Clear timeout on error
      setPendingCompletionTask(null);
      setIsSubmitting(false);
      submissionLockRef.current = false;
      toast({
        title: 'Error',
        description: 'Failed to complete task. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleNextProduct = useCallback(() => {
    setShowSuccess(false);
    setCompletedReward(0);
    setPendingCompletionTask(null);
    setIsLoadingProduct(true);
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setIsLoadingProduct(false);
  }, []);

  // Ensure catalog is never empty - use defaults if needed
  // Since getTrainingProducts/getPersonalProducts are now async, we use the defaults synchronously
  const safeCatalog = productCatalog.length > 0 ? productCatalog : 
    (user?.account_type === 'training' 
      ? [ProductCatalogService.getProductForTask(1, 'training', undefined)] 
      : [ProductCatalogService.getProductForTask(1, 'personal', undefined)]);
  
  // RESTORED: Original product-based commission with scaling to achieve $165.60 total
  const RAW_COMMISSION_RATE = 0.01; // 1% base rate
  const SCALE_FACTOR = 2.735; // Scale raw commissions to reach $165.60 total
  
  // Helper function to calculate scaled commission for a product
  const calculateScaledCommission = (price: number) => {
    const rawCommission = price * RAW_COMMISSION_RATE;
    return Math.round(rawCommission * SCALE_FACTOR * 100) / 100;
  };
  
  // For personal/admin accounts, use task.reward from database (NOT product-based calculation)
  const currentTaskCommission = pendingTask ? (() => {
    if (isTraining) {
      // Use scaled product-based commission for training accounts
      const product = safeCatalog[(pendingTask.task_number - 1) % safeCatalog.length];
      if (product) {
        const commission = calculateScaledCommission(product.price);
        console.log('[TaskGrid] Scaled product commission for task', pendingTask.task_number, ':', commission);
        return commission;
      }
      return 0;
    }
    // For personal accounts, use reward from database (predefined values for VIP1)
    // If database reward is 0, null, or undefined, fall back to VIP1 commission calculation
    const dbReward = pendingTask.reward || 0;
    if (dbReward > 0) {
      console.log('[TaskGrid] Using database reward for personal task', pendingTask.task_number, ':', dbReward);
      return dbReward;
    }
    
    // Fallback: Dynamic commission rate for personal accounts to ensure exactly $10.25 for 35 tasks
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
    let commission: number;
    if (pendingTask.task_number <= 32) {
      // Tasks 1-32: Generate varied commission between $0.15 and $0.42
      const randomValue = deterministicRandom(pendingTask.task_number);
      commission = MIN_COMMISSION + (randomValue * (MAX_COMMISSION - MIN_COMMISSION));
      console.log('[TaskGrid] Dynamic commission for task', pendingTask.task_number, ':', commission.toFixed(2));
    } else {
      // Tasks 33-35: Calculate remaining balance to hit exactly $10.25
      // For now, use the average of remaining tasks (will be adjusted in task creation)
      const remainingTasks = TOTAL_TASKS - pendingTask.task_number + 1;
      commission = TARGET_TOTAL / TOTAL_TASKS; // Fallback to average
      console.log('[TaskGrid] Final task commission for task', pendingTask.task_number, ':', commission.toFixed(2));
    }
    
    return commission;
  })() : 0;

  // When pending order exists and we're at the trigger task, show pending product
  const currentProduct = pendingTask 
    ? (user?.has_pending_order && pendingTask.task_number === user?.trigger_task_number && user?.pending_product)
      ? user?.pending_product  // Show the pending order product
      : safeCatalog.length > 0 
        ? safeCatalog[(pendingTask.task_number - 1) % safeCatalog.length]  // Show regular product
        : { id: 'loading', name: 'Loading...', brand: 'Loading', price: 0, category: 'Loading', image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect width=%22150%22 height=%22150%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E' }
    : null;
  // For training accounts, rebuild task list based on user.task_number from Supabase
  const taskList = isTraining 
    ? Array.from({ length: 45 }, (_, i) => {
        const taskNum = i + 1;
        const currentTaskNum = user?.task_number || 1;
        let status: 'completed' | 'pending' | 'locked' = 'locked';
        if (taskNum < currentTaskNum) status = 'completed';
        else if (taskNum === currentTaskNum) status = 'pending';
        
        // Get product for display purposes (name, image, commission, etc.)
        const product = safeCatalog[(taskNum - 1) % safeCatalog.length];
        
        // Use scaled product-based commission for training accounts (unique per product)
        const commission = product ? calculateScaledCommission(product.price) : 0;
        
        return {
          id: `task_${taskNum}`,
          task_number: taskNum,
          status,
          reward: commission,
          title: product?.name || `Task ${taskNum}`,
          description: `Task ${taskNum}`,
          user_id: user?.id || '',
          created_at: new Date().toISOString(),
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          task_set: 0
        };
      })
    : (safeTasks.length > 0 ? safeTasks : Array.from({ length: 35 }, (_, i) => ({ task_number: i + 1, status: i === 0 ? 'pending' : 'locked', reward: [0.7, 1.6, 2.5, 6.4, 7.2][i % 5] })));
  const previewProduct = safeCatalog[2] || safeCatalog[0] || { id: 'preview', name: 'iPhone X', brand: 'Apple', price: 999.99, category: 'Electronics', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' };
  const previewImageSrc = previewProduct?.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400';

  useEffect(() => {
    setPreviewImageFailed(false);
  }, [previewImageSrc]);

  // Checkpoint modal visibility state - ONLY show for pending_review (blocking) in Phase 2
  // Phase 1 has NO checkpoint modal
  const isPhase2Checkpoint = Number(user?.training_phase) === 2 && user?.training_phase_2_checkpoint?.status === 'pending_review';
  const [showCheckpointModal, setShowCheckpointModal] = useState(isPhase2Checkpoint);
  
  // Update modal visibility when checkpoint status changes (Phase 2 only)
  useEffect(() => {
    // Only auto-show modal for pending_review (blocking state) in Phase 2
    // Phase 1 has no checkpoint modal
    const isPhase2 = Number(user?.training_phase) === 2;
    if (isPhase2 && user?.training_phase_2_checkpoint?.status === 'pending_review') {
      setShowCheckpointModal(true);
    }
  }, [user?.training_phase_2_checkpoint?.status, user?.training_phase]);
  
  // Handle checkpoint product submission
  const handleSubmitCheckpointProduct = async (e?: React.MouseEvent) => {
    console.log('[SUBMIT SOURCE] handleSubmitCheckpointProduct called from button click');
    console.log('[SUBMIT SOURCE] Event type:', e?.type);
    console.log('[SUBMIT SOURCE] Event target:', e?.target);
    
    // STOP EVENT BUBBLING: Prevent duplicate triggers from parent containers
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    // HARD LOCK: Prevent duplicate submissions across re-renders
    if (submissionLockRef.current) {
      console.log('[Checkpoint Submit] Already submitting, skipping...');
      console.log('[Checkpoint Submit] CALL STACK:', new Error().stack);
      return;
    }
    
    // Set lock immediately to prevent any further submissions
    submissionLockRef.current = true;
    
    console.log('[Checkpoint Submit] button clicked');
    console.log('[Checkpoint Submit] CALL STACK:', new Error().stack);

    try {
      if (!user?.training_phase_2_checkpoint || !user?.id) {
        console.error('[Checkpoint Submit] Missing user or checkpoint data');
        return;
      }

      const checkpointId = user?.training_phase_2_checkpoint?.id;
      if (!checkpointId || !user?.id) {
        console.error('[Checkpoint Submit] Missing checkpoint data or user ID');
        return;
      }
      console.log('[Checkpoint Submit] checkpoint id:', checkpointId);
      console.log('[Checkpoint Submit] passing checkpoint data from frontend state');

      const result = await SupabaseService.submitCheckpointProduct(
        user?.id,
        checkpointId,
        user?.phase2_checkpoint // Pass full checkpoint object to avoid hanging fetch
      );
      
      if (result.success) {
        console.log('[Checkpoint Submit] checkpoint completed, clearing frontend state immediately');
        
        // IMMEDIATELY clear checkpoint from frontend state to hide premium submit section
        // This ensures the UI updates before the reload
        if (user) {
          console.log('[Checkpoint Submit] Clearing phase2_checkpoint from user state');
          // @ts-ignore - we know this field exists
          user.phase2_checkpoint = null;
        }
        
        toast({
          title: 'Premium product submitted. 6x profit added.',
          description: `Reward of $${result.bonusAmount?.toFixed(2)} has been added to your balance. Task advanced to ${result.nextTaskNumber}.`,
          variant: 'default',
        });
        
        // Close modal and refresh user data
        setShowCheckpointModal(false);

        // Refresh user data to get updated balance (background, non-blocking)
        refreshTasks().catch(err => console.error('[Checkpoint] Background refreshTasks error:', err));
        refreshUser().catch(err => console.error('[Checkpoint] Background refreshUser error:', err));

        // Small delay to ensure state updates before reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('[Checkpoint Submit] Submission failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit checkpoint product',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[Checkpoint Submit] Exception during submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      submissionLockRef.current = false; // Release lock
      console.log('[Checkpoint Submit] Finished - lock reset');
    }
  };

  const handleSubmitPersonalDay2CheckpointProduct = async (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    
    if (submissionLockRef.current) {
      console.log('[PersonalDay2Checkpoint Submit] Already submitting, skipping...');
      return;
    }
    
    submissionLockRef.current = true;
    
    console.log('[PersonalDay2Checkpoint Submit] button clicked');

    try {
      if (!user?.personal_day2_checkpoint || !user?.id) {
        console.error('[PersonalDay2Checkpoint Submit] Missing user or checkpoint data');
        return;
      }

      const checkpointId = user?.personal_day2_checkpoint?.id;
      if (!checkpointId || !user?.id) {
        console.error('[PersonalDay2Checkpoint Submit] Missing checkpoint data or user ID');
        return;
      }
      console.log('[PersonalDay2Checkpoint Submit] checkpoint id:', checkpointId);

      const result = await SupabaseService.submitPersonalDay2CheckpointProduct(
        user?.id,
        checkpointId
      );
      
      if (result.success) {
        console.log('[PersonalDay2Checkpoint Submit] checkpoint completed');
        
        toast({
          title: 'Premium product submitted. 6x profit added.',
          description: `Reward of $${result.bonusAmount?.toFixed(2)} has been added to your balance. Task advanced to ${result.nextTaskNumber}.`,
          variant: 'default',
        });
        
        setShowPersonalDay2CheckpointModal(false);

        refreshTasks().catch(err => console.error('[PersonalDay2Checkpoint] Background refreshTasks error:', err));
        refreshUser().catch(err => console.error('[PersonalDay2Checkpoint] Background refreshUser error:', err));

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('[PersonalDay2Checkpoint Submit] Submission failed:', result.error);
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit checkpoint product',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[PersonalDay2Checkpoint Submit] Exception during submission:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      submissionLockRef.current = false;
      console.log('[PersonalDay2Checkpoint Submit] Finished - lock reset');
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Set Transition Loading State */}
      {isTransitioningToSet2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md p-8 text-center shadow-2xl">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping" style={{ animationDelay: '0.5s' }} />
              <div className="absolute inset-0 rounded-full border-4 border-pink-500/30 animate-ping" style={{ animationDelay: '1s' }} />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Set 1 Completed!</h3>
            <p className="text-gray-400 mb-4">Congratulations! You have completed Set 1.</p>
            <p className="text-indigo-400 font-medium">Unlocking Set 2...</p>
            <div className="w-full h-1 bg-white/10 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar" />
            </div>
          </div>
        </div>
      )}

      {/* Current Set Display */}
      {!isTransitioningToSet2 && (
        <div className="bg-[#0f1420] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              currentTaskSet === 1 ? 'bg-indigo-500/20' : 'bg-emerald-500/20'
            }`}>
              <Star className={`w-5 h-5 ${currentTaskSet === 1 ? 'text-indigo-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <p className="text-white font-semibold">Current Set</p>
              <p className={`text-sm ${currentTaskSet === 1 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                {user?.account_type === 'personal' 
                  ? `Set 2 (${user?.training_progress || 0}/${isTraining ? 45 : 35})`
                  : currentTaskSet === 1
                    ? `Set 1 (${user?.training_progress || 0}/${isTraining ? 45 : 35})`
                    : `Set 2 (${user?.training_progress || 0}/${isTraining ? 45 : 35})`
                }
              </p>
            </div>
          </div>
          {user?.set_1_completed_at && (
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">Set 1 Completed</span>
            </div>
          )}
        </div>
      )}

      {/* Phase 1 Lock Modal for VIP2 (45/45 completed) */}
      {showPhase1LockModal && (
        <Dialog open={showPhase1LockModal} onOpenChange={setShowPhase1LockModal}>
          <DialogContent className="bg-[#1a1f2e] border-white/[0.06] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Phase 1 Completed!</DialogTitle>
              <DialogDescription className="text-gray-400">
                Congratulations! You have completed Phase 1 (45/45 tasks).
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-400 font-bold">Account Locked</h3>
                  <p className="text-amber-300/60 text-sm">Contact Customer Service to unlock Phase 2</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
              >
                Contact Customer Service
              </Button>
              <Button
                onClick={() => setShowPhase1LockModal(false)}
                variant="outline"
                className="w-full border-white/[0.06] text-white hover:bg-white/[0.05]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Phase 2 Checkpoint Modal for VIP2 (task #30) */}
      {showPhase2CheckpointModal && (
        <Dialog open={showPhase2CheckpointModal} onOpenChange={setShowPhase2CheckpointModal}>
          <DialogContent className="bg-[#1a1f2e] border-white/[0.06] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Phase 2 Checkpoint</DialogTitle>
              <DialogDescription className="text-gray-400">
                You have reached task #30 in Phase 2. Admin review required for 6x multiplier.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-emerald-400 font-bold">6x Multiplier Available</h3>
                  <p className="text-emerald-300/60 text-sm">Contact Customer Service to claim your reward</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                Contact Customer Service
              </Button>
              <Button
                onClick={() => setShowPhase2CheckpointModal(false)}
                variant="outline"
                className="w-full border-white/[0.06] text-white hover:bg-white/[0.05]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Personal Day 2 Checkpoint Modal (task #21) */}
      {showPersonalDay2CheckpointModal && user?.personal_day2_checkpoint?.status === 'pending_review' && (
        <Dialog open={showPersonalDay2CheckpointModal} onOpenChange={setShowPersonalDay2CheckpointModal}>
          <DialogContent className="bg-[#1a1f2e] border-white/[0.06] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Day 2 Checkpoint</DialogTitle>
              <DialogDescription className="text-gray-400">
                You have reached task #21 in Day 2. Admin review required for 6x multiplier.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-emerald-400 font-bold">6x Multiplier Available</h3>
                  <p className="text-emerald-300/60 text-sm">Contact Customer Service to claim your reward</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={() => {
                  window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                Contact Customer Service
              </Button>
              <Button
                onClick={() => setShowPersonalDay2CheckpointModal(false)}
                variant="outline"
                className="w-full border-white/[0.06] text-white hover:bg-white/[0.05]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Personal Day 2 Checkpoint Approved - Combination Product Review with Submit Button */}
      {user?.account_type === 'personal' && 
       user?.personal_cycle === 2 &&
       user?.personal_day2_checkpoint?.status === 'approved' &&
       Number(user?.tasks_completed) <= Number(user?.personal_day2_checkpoint?.task_number || 21) && (
        <div className="space-y-4">
          <div className="bg-[#1a1f2e] border border-white/[0.06] rounded-2xl p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Combination Product Review Required</h2>
              <p className="text-gray-400">Day 2 • Task {user?.personal_day2_checkpoint?.task_number || 21}</p>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-400 font-bold">Manual Review Required</h3>
                  <p className="text-amber-300/60 text-sm">Admin approved - Submit now to claim your 6x checkpoint reward</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-400 font-bold text-lg">6x Profit Bonus</p>
                    <p className="text-amber-300/60 text-sm">Commission Reward</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-400">$186.00</p>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={(e) => { 
                e?.stopPropagation?.(); 
                handleSubmitPersonalDay2CheckpointProduct(e); 
              }}
              className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Premium Product
            </Button>
          </div>
        </div>
      )}

      {/* Phase 2 Checkpoint Modal - ONLY for Phase 2 pending_review (blocking) */}
      {Number(user?.training_phase) === 2 && showCheckpointModal && user?.phase2_checkpoint?.status === 'pending_review' && (
        <Phase2Checkpoint 
          checkpoint={user?.phase2_checkpoint}
          onContactSupport={() => {
            window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
          }}
          onClose={() => setShowCheckpointModal(false)}
          onSubmitCheckpointProduct={handleSubmitCheckpointProduct}
          userBalance={user?.balance}
        />
      )}
      
      {/* Checkpoint Approved - Combination Product Review with Submit Button (Phase 2 only) */}
      {/* Only show if checkpoint is approved AND current task number matches checkpoint task number */}
      {/* If task number has advanced beyond checkpoint, checkpoint is considered completed */}
      {Number(user?.training_phase) === 2 && 
       user?.phase2_checkpoint?.status === 'approved' &&
       Number(user?.task_number) <= Number(user?.phase2_checkpoint?.task_number || 31) && (
        <div className="space-y-4">
          {/* Header Section */}
          <div className="bg-[#1a1f2e] border border-white/[0.06] rounded-2xl p-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">Combination Product Review Required</h2>
              <p className="text-gray-400">Phase 2 • Task {user?.phase2_checkpoint?.task_number || 31}</p>
            </div>
            
            {/* Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-amber-400 font-bold">Manual Review Required</h3>
                  <p className="text-amber-300/60 text-sm">Admin approved - Submit now to claim your 6x checkpoint reward</p>
                </div>
              </div>
            </div>
            
            {/* Combination Product Pair */}
            <div className="bg-[#0f1420] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-4">Combination Product Pair</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product 1 */}
                <div className="bg-[#1a1f2e] rounded-xl p-4 flex items-center gap-4">
                  {phase2Product1Failed ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                  ) : (
                    <img
                      src={user?.phase2_checkpoint?.product1_image || safeCatalog[0]?.image}
                      alt={user?.phase2_checkpoint?.product1_name || 'Product 1'}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-800"
                      crossOrigin="anonymous"
                      onError={() => setPhase2Product1Failed(true)}
                    />
                  )}
                  <div>
                    <h4 className="text-white font-medium">{user?.phase2_checkpoint?.product1_name || 'PulseTrack Slim'}</h4>
                    <p className="text-emerald-400 font-bold">${(user?.phase2_checkpoint?.product1_price || 69.99).toFixed(2)}</p>
                  </div>
                </div>
                
                {/* Plus divider */}
                <div className="hidden md:flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
                
                {/* Product 2 */}
                <div className="bg-[#1a1f2e] rounded-xl p-4 flex items-center gap-4">
                  {phase2Product2Failed ? (
                    <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-500" />
                    </div>
                  ) : (
                    <img
                      src={user?.phase2_checkpoint?.product2_image || safeCatalog[1]?.image}
                      alt={user?.phase2_checkpoint?.product2_name || 'Product 2'}
                      className="w-16 h-16 rounded-lg object-cover bg-gray-800"
                      crossOrigin="anonymous"
                      onError={() => setPhase2Product2Failed(true)}
                    />
                  )}
                  <div>
                    <h4 className="text-white font-medium">{user?.phase2_checkpoint?.product2_name || 'Studio Monitor Pro'}</h4>
                    <p className="text-emerald-400 font-bold">${(user?.phase2_checkpoint?.product2_price || 199.99).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 6x Profit Info */}
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-amber-400 font-bold text-lg">6x Profit Bonus</p>
                    <p className="text-amber-300/60 text-sm">Commission Reward</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-amber-400">${user?.phase2_checkpoint?.bonus_amount?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <Button 
              onClick={(e) => { 
                console.log('[SUBMIT SOURCE] Checkpoint submit button clicked'); 
                console.log('[SUBMIT SOURCE] Event type:', e?.type);
                console.log('[SUBMIT SOURCE] Event target:', e?.target);
                e?.stopPropagation?.(); 
                handleSubmitCheckpointProduct(e); 
              }}
              className="w-full py-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30"
            >
              <CheckCircle className="w-5 h-5 mr-2" style={{ pointerEvents: 'none' }} />
              <span style={{ pointerEvents: 'none' }}>Submit Premium Product</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Combination Order Modal - Blocks tasks when pending order exists */}
      {user?.has_pending_order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl shadow-purple-500/10">
            {/* Header with gradient accent */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Combination Order Detected</h3>
                  <span className="text-xs text-amber-400 font-medium">Pending Order</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                A premium optimization product has been assigned to your account. Your balance is temporarily negative. Please contact support to proceed.
              </p>
              
              {/* Balance Display */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-red-400">-${Math.abs(user?.pending_amount || 0).toFixed(2)}</p>
              </div>
              
              {/* Info note */}
              <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Lock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-400/80">
                  Tasks are temporarily locked until this order is cleared by customer service.
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => setShowSupportOptions(true)}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                Contact Support
              </button>
              <button 
                onClick={() => setShowCombinationModal(false)}
                className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Claim 6x Profit Modal - Shows after admin clears pending order */}
      {!user?.has_pending_order && user?.trigger_task_number && !user?.profit_added && user?.pending_product && showClaimProfitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-emerald-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-emerald-500/10">
            {/* Header with emerald gradient */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">6x Profit Available!</h3>
                  <span className="text-xs text-emerald-400 font-medium">Order Cleared</span>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Your combination order has been cleared. Click below to claim your 6x profit reward!
              </p>
              
              {/* Product Display */}
              <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl">
                <p className="text-xs text-gray-500 mb-2">Pending Product</p>
                <p className="text-lg font-bold text-white">{user?.pending_product?.name || 'Loading...'}</p>
                <p className="text-sm text-gray-400">{user?.pending_product?.brand || ''} • {user?.pending_product?.category || ''}</p>
              </div>
              
              {/* Profit Display */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">6x Profit Reward</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                  <span className="text-3xl font-bold text-emerald-400">{((user?.pending_amount || 210) * 6).toFixed(2)}</span>
                </div>
                <p className="text-xs text-emerald-400/60 mt-1">${(user?.pending_amount || 210).toFixed(2)} × 6</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const result = await completeTask(pendingTask.task_number);

if (result.success) {
  toast({
    title: '6x Profit Added!',
    description: `$$${pendingTask.reward.toFixed(2)} has been added`,
    variant: 'default',
  });

  window.location.reload();
} else {
                      toast({
                        title: 'Already Claimed',
                        description: 'This profit has already been added to your account.',
                        variant: 'destructive',
                      });
                    }
                  } catch (err) {
                    toast({
                      title: 'Error',
                      description: 'Failed to claim profit. Please try again.',
                      variant: 'destructive',
                    });
                  }
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><DollarSign className="w-4 h-4" /> Claim 6x Profit</>
                )}
              </button>
              <button 
                onClick={() => setShowClaimProfitModal(false)}
                className="px-4 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Support Options Modal - Shows Pink CS and Telegram CS */}
      {showSupportOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-pink-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Contact Support</h3>
                  <span className="text-xs text-pink-400 font-medium">Choose your preferred support channel</span>
                </div>
              </div>
            </div>
            
            {/* Support Options */}
            <div className="p-6 space-y-4">
              {/* Pink CS Option */}
              <a 
                href="https://pinkcs.example.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-pink-500/10 border border-pink-500/20 rounded-xl hover:bg-pink-500/20 transition-all group relative"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-500/20 ${unreadCount > 0 ? 'animate-pulse' : ''}`}>
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold group-hover:text-pink-400 transition-colors">Pink Customer Service</h4>
                  <p className="text-sm text-gray-400">Live chat support available 24/7</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-pink-400 transition-colors" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <span className="text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  </div>
                )}
              </a>
              
              {/* Telegram CS Option */}
              <a 
                href="https://t.me/your_support_bot" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors">Telegram Support</h4>
                  <p className="text-sm text-gray-400">Message us on Telegram for quick help</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </a>
            </div>
            
            {/* Close Button */}
            <div className="p-6 pt-0">
              <button 
                onClick={() => setShowSupportOptions(false)}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrainingShowroomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f1420] border border-indigo-500/20 rounded-2xl w-full max-w-md shadow-2xl shadow-indigo-500/10">
            <div className="px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Training Access Required</h3>
                  <span className="text-xs text-indigo-300 font-medium">Showroom Preview Only</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-300 leading-relaxed">
                You are viewing the task showroom. Complete training first to unlock live task submission and earning access.
              </p>
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-300 mb-1">Next Step</p>
                <p className="text-sm text-gray-300">Please finish your training program, then return to start live earning tasks.</p>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button
                onClick={() => setShowTrainingShowroomModal(false)}
                className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-gray-300 hover:text-white rounded-xl font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <DailyBonus />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-indigo-500/15 flex items-center justify-center"><Zap size={18} className="text-indigo-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{isTraining ? 'Training Progress' : 'Tasks Progress'}</p>
              <p className="text-lg md:text-xl font-bold text-white">{displayCompletedCount} / {totalTasks}</p>
            </div>
          </div>
          <div className="mt-2 md:mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-emerald-500/15 flex items-center justify-center"><DollarSign size={18} className="text-emerald-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Earned</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400">${totalReward.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="p-3 md:p-5 bg-white/[0.03] border border-white/[0.06] rounded-xl md:rounded-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-amber-500/15 flex items-center justify-center"><Award size={18} className="text-amber-400" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Account Type</p>
              <p className="text-lg md:text-xl font-bold text-amber-400">{isTraining ? 'Training' : `VIP${user?.vip_level || 1}`}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl md:rounded-2xl overflow-hidden">
        <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.06]">
          <h2 className="text-base md:text-lg font-bold text-white flex items-center gap-2"><ShoppingBag size={16} className="text-indigo-400" />{isTraining ? 'Training Tasks' : 'Product Review Tasks'}</h2>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">{isTraining ? 'Complete training tasks to unlock personal account features' : 'Review products to earn rewards'}</p>
        </div>
        <div className="p-4 md:p-8">
          {needsTraining ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={40} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Training Required</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                You must complete the training program before you can start earning from product reviews.
              </p>
              {/* Show product preview without submit button */}
              <div className="max-w-xs mx-auto mb-6 opacity-95 select-none">
                <div className="relative bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden p-4 text-center">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Award size={12} className="text-white" />
                      <span className="text-xs font-bold text-white">VIP1</span>
                    </div>
                  </div>
                  <div className="relative flex items-center justify-center min-h-[150px] mb-3 mt-6 rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#0a111f] via-[#131d2f] to-[#0c1424] overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.06]" />
                    <div className="absolute -inset-10 rounded-full bg-indigo-500/10 blur-2xl animate-pulse" />
                    <div
                      className="relative w-full max-w-[125px] h-[125px] animate-spin"
                      style={{ animationDuration: '16s', animationTimingFunction: 'linear' }}
                    >
                      {!previewImageFailed && previewImageSrc ? (
                        <img
                          src={previewImageSrc}
                          alt={previewProduct?.name || 'Preview'}
                          className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)]"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl border border-white/[0.12] bg-gradient-to-br from-slate-800/90 to-slate-900/90 flex items-center justify-center">
                          <Package className="w-10 h-10 text-indigo-300/80" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <h3 className="text-sm font-bold text-white">{previewProduct?.name || 'Product Preview'}</h3>
                    <p className="text-xs text-gray-500">{previewProduct?.brand || 'Brand'} • {previewProduct?.category || 'Category'}</p>
                  </div>
                  <div className="mb-3 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Commission Reward</p>
                    <div className="flex items-center justify-center gap-1">
                      <DollarSign size={14} className="text-emerald-500/60" />
                      <span className="text-base font-bold text-emerald-500/60">0.25</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTrainingShowroomModal(true)}
                    className="w-full py-2.5 font-extrabold rounded-lg text-sm tracking-wide bg-gradient-to-r from-indigo-600/70 via-purple-600/70 to-indigo-600/70 border border-indigo-400/25 text-white shadow-lg shadow-indigo-900/30 hover:from-indigo-500/80 hover:via-purple-500/80 hover:to-indigo-500/80 transition-all"
                  >
                    TASK SHOWROOM
                  </button>
                </div>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-xs mx-auto mb-4">
                <ul className="text-xs text-gray-400 text-center list-none space-y-1">
                  <li className="text-amber-400 font-medium">Full earning capabilities</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">Please contact support if you need training account access.</p>
            </div>
          ) : allComplete ? (
            <div className="text-center py-12">
              {isTraining && user?.training_phase === 1 ? (
                // Phase 1 Complete - Show contact customer service message
                <>
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-blue-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">🎉 Phase 1 Complete!</h3>
                  <p className="text-gray-400 mb-4">You've completed all 45 tasks in Phase 1!</p>
                  <p className="text-lg font-bold text-emerald-400 mb-6">Total earned: ${totalReward.toFixed(2)}</p>
                  
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-md mx-auto mb-4">
                    <p className="text-amber-400 font-medium mb-2">⏳ Account Reset Required</p>
                    <p className="text-sm text-gray-400">Contact Customer Service to reset your account and continue to Phase 2</p>
                  </div>
                  
                  <button 
                    onClick={() => window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank')}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <Headphones className="w-5 h-5" />
                    Contact Customer Service
                  </button>
                </>
              ) : isTraining && user?.training_phase === 2 ? (
                // Phase 2 Complete - Training fully done
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-emerald-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">🏆 Training Complete!</h3>
                  <p className="text-gray-400 mb-4">Congratulations! You have completed both training phases.</p>
                  <p className="text-lg font-bold text-emerald-400 mb-6">Total earned: ${totalReward.toFixed(2)}</p>
                  
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl max-w-md mx-auto mb-4">
                    <p className="text-emerald-400 font-medium mb-2">🎉 Personal Account Activated</p>
                    <p className="text-sm text-gray-400">Your personal account is now fully activated. Your earnings have been automatically transferred.</p>
                  </div>
                </>
              ) : (
                // Personal account completion
                <>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4"><Award size={40} className="text-emerald-400" /></div>
                  <h3 className="text-2xl font-bold text-white mb-2">All Tasks Complete!</h3>
                  <p className="text-gray-400 mb-2">You've completed all {totalTasks} product reviews</p>
                  <p className="text-lg font-bold text-emerald-400">Total earned: ${totalReward.toFixed(2)}</p>
                </>
              )}
            </div>
          ) : showSuccess ? (
            <SuccessMessage reward={completedReward} onNext={handleNextProduct} />
          ) : isLoadingProduct ? (
            <ProductPreloader onComplete={handlePreloaderComplete} />
          ) : user?.has_pending_order && pendingTask?.task_number === user?.trigger_task_number && user?.pending_product ? (
            <CombinationProductCard 
              product1={safeCatalog.length > 0 ? safeCatalog[(pendingTask.task_number - 1) % safeCatalog.length] : { id: 'p1', name: 'Product 1', brand: 'Loading', price: 0, category: 'Loading', image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect width=%22150%22 height=%22150%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E' }} 
              product2={safeCatalog.length > 0 ? safeCatalog[(pendingTask.task_number) % safeCatalog.length] : { id: 'p2', name: 'Product 2', brand: 'Loading', price: 0, category: 'Loading', image: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22150%22 height=%22150%22%3E%3Crect width=%22150%22 height=%22150%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E' }}
              combinedPrice={user?.pending_amount || 210}
              taskNumber={pendingTask.task_number}
              userBalance={user?.balance || 0}
              onContactSupport={() => setShowSupportOptions(true)}
            />
          ) : currentProduct && pendingTask && user?.phase2_checkpoint?.status !== 'pending_review' ? (
            <SimpleProductCard product={currentProduct as Product} reward={currentTaskCommission} taskNumber={pendingTask.task_number} totalTasks={totalTasks} onSubmit={handleSubmit} isSubmitting={isSubmitting} isTraining={isTraining} hasPendingOrder={user?.has_pending_order} vipLevel={user?.vip_level} />
          ) : isTasksLoading ? (
            <div className="text-center py-12">
              <Loader2 size={40} className="text-indigo-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">Loading Tasks...</h3>
              <p className="text-gray-400">Please wait while we fetch your tasks.</p>
            </div>
          ) : (
            <div className="text-center py-12"><Lock size={40} className="text-gray-500 mx-auto mb-4" /><h3 className="text-xl font-bold text-white mb-2">No Active Tasks</h3><p className="text-gray-400">No pending tasks available at the moment.</p></div>
          )}
        </div>
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center justify-between mb-2 md:mb-3"><span className="text-xs font-medium text-gray-500">Product Queue</span><span className="text-xs font-bold text-indigo-400">{displayCompletedCount}/{totalTasks} completed</span></div>
          <ProgressTracker tasks={taskList} currentTask={pendingTask?.task_number || 0} productCatalog={productCatalog} />
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6 px-2">
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500" /><span className="text-xs text-gray-400">Completed</span></div>
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-indigo-500 animate-pulse" /><span className="text-xs text-gray-400">Current</span></div>
        <div className="flex items-center gap-1.5 md:gap-2"><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gray-700" /><span className="text-xs text-gray-400">Locked</span></div>
      </div>
    </div>
  );
};

export default TaskGrid;
