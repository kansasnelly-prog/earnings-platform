import React from 'react';
import { AlertTriangle, MessageCircle, X, Package, Plus, Sparkles, DollarSign } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';

interface CombinationOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CombinationOrderModal: React.FC<CombinationOrderModalProps> = ({ isOpen, onClose }) => {
  const { user, clearPendingOrderAndClaimProfit } = useAppContext();

  if (!isOpen || !user?.has_pending_order) return null;

  const handleContactSupport = () => {
    window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank');
  };

  const handleClearOrder = async () => {
    const result = await clearPendingOrderAndClaimProfit();
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Combination Order Detected</h2>
              <p className="text-sm text-gray-400">Your account encountered a premium optimization product</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
            aria-label="Close combination order modal"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Combination Product Display */}
        {user?.pending_product && (
          <div className="bg-gradient-to-br from-purple-900/30 via-indigo-900/20 to-purple-900/30 border-2 border-purple-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Premium Combination</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            
            {/* Product Display */}
            <div className="bg-white/5 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                  <Package className="w-8 h-8 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">{user.pending_product.name || 'Combination Product'}</h3>
                  <p className="text-xs text-gray-400">2 Products Combined • Premium Tier</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-300">Product A</span>
                    <Plus className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-purple-300">Product B</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Price Breakdown */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Combination Price:</span>
              <span className="font-bold text-white">${user.pending_amount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-400">Pending Order</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            Your account balance is temporarily negative due to this combination order.
          </p>
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
            <span className="text-xs text-gray-400">Amount Deducted:</span>
            <span className="text-sm font-bold text-red-400">-${user.pending_amount?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-blue-400">1</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Contact Customer Service</p>
              <p className="text-xs text-gray-400">Get help clearing the combination order</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-400">2</span>
            </div>
            <div>
              <p className="text-sm text-white font-medium">Clear the Order</p>
              <p className="text-xs text-gray-400">Restore balance and receive 6x profit</p>
            </div>
          </div>
        </div>

        {/* Actions - Hide Clear Order for training accounts */}
        <div className={`grid gap-3 ${user?.account_type === 'training' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <button
            onClick={handleContactSupport}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
          >
            <MessageCircle size={16} />
            Contact Support
          </button>
          {user?.account_type !== 'training' && (
            <button
              onClick={handleClearOrder}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
            >
              <AlertTriangle size={16} />
              Clear Order
            </button>
          )}
        </div>

        {/* 6x Profit Illustration */}
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-900/20 via-green-900/20 to-emerald-900/20 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400 uppercase">6× Profit Reward</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          
          {/* Calculation Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Your Investment:</span>
              <span className="text-red-400">-${user.pending_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount Returned:</span>
              <span className="text-white">+${user.pending_amount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">6× Profit Bonus:</span>
              <span className="text-emerald-400 font-bold">+${((user.pending_amount || 0) * 6).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total You Receive:</span>
                <span className="text-emerald-400 font-bold text-lg">
                  ${((user.pending_amount || 0) * 7).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-3">
            After admin clears your order, you get your money back + 6× profit!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CombinationOrderModal;
