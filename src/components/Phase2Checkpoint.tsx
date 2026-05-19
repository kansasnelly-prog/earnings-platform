import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, Lock, MessageCircle, Sparkles, X, Package } from 'lucide-react';
import { Phase2Checkpoint as CheckpointType } from '@/services/supabaseService';

interface Phase2CheckpointProps {
  checkpoint: CheckpointType;
  onContactSupport: () => void;
  onClose?: () => void;
  onSubmitCheckpointProduct?: () => void;
  userBalance?: number;
}

const Phase2Checkpoint: React.FC<Phase2CheckpointProps> = ({ 
  checkpoint, 
  onContactSupport, 
  onClose,
  onSubmitCheckpointProduct,
  userBalance = 0
}) => {
  const { user } = useAppContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  const isPending = checkpoint.status === 'pending_review';
  const isApproved = checkpoint.status === 'approved';
  const combinationValue = checkpoint.combination_value || (checkpoint.product1_price + checkpoint.product2_price);
  const displayBalance = userBalance < 0 ? userBalance : (user?.balance || 0);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className={`w-full max-w-md max-h-[85vh] flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-amber-500/30 shadow-2xl transform transition-all duration-500 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} relative`}>
        {/* X Close Button - Fixed at top right, always visible */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-white hover:text-white transition-colors z-50 shadow-lg border border-slate-500"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        
        <CardHeader className="text-center pb-2 pt-8 px-4 flex-shrink-0">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-3 animate-pulse">
            <Sparkles className="w-8 h-8 text-amber-400" />
          </div>
          <CardTitle className="text-xl font-bold text-white">
            {isPending ? 'Checkpoint Review' : 'Checkpoint Status'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 overflow-y-auto px-4 pb-4" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {isPending && (
            <>
              {/* Combination Product Card - Compact */}
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600/50">
                <div className="relative p-3 space-y-2">
                  <p className="text-center text-xs font-medium text-slate-400">
                    Combination Product Pair
                  </p>
                  
                  {/* Product 1 */}
                  <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <img 
                        src={checkpoint.product1_image} 
                        alt={checkpoint.product1_name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/334155/475569?text=Product';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-xs truncate">{checkpoint.product1_name}</p>
                      <p className="text-amber-400 text-xs">${checkpoint.product1_price.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {/* Plus Icon */}
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 text-sm font-bold">+</span>
                    </div>
                  </div>
                  
                  {/* Product 2 */}
                  <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      <img 
                        src={checkpoint.product2_image} 
                        alt={checkpoint.product2_name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/334155/475569?text=Product';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-xs truncate">{checkpoint.product2_name}</p>
                      <p className="text-amber-400 text-xs">${checkpoint.product2_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Account Status - Single Line Layout */}
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
                {/* Review Amount + Total Balance in one line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-medium text-xs">Review Amount</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-xs">Total Balance: <span className="text-slate-300">${displayBalance.toFixed(2)}</span></span>
                    <span className="text-red-500 font-bold">-${combinationValue.toFixed(2)}</span>
                  </div>
                </div>
                
                <p className="text-red-400/70 text-xs">
                  Your balance is temporarily negative pending review. Submit the checkpoint product after approval to restore positive balance.
                </p>
              </div>
              
              {/* Premium Product - 6x Profit - Compact */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-medium text-xs">Premium Product</span>
                  </div>
                  <span className="text-amber-300 text-xs text-right">EARN 6x profit when approved</span>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-center gap-2 p-2 bg-slate-800/50 rounded-lg">
                <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-amber-400 text-sm">Waiting for admin review...</span>
              </div>
              
              {/* Action Buttons - Compact */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={onContactSupport}
                  className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Customer Service
                </Button>
                
                {onClose && (
                  <Button 
                    onClick={onClose}
                    variant="outline"
                    className="w-full py-4 border-slate-600 text-slate-300 hover:bg-slate-800 text-sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close & Return
                  </Button>
                )}
              </div>
              
              <p className="text-center text-slate-500 text-xs">
                Task submission paused until review complete.
              </p>
            </>
          )}
          
          {isApproved && (
            <>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm">Checkpoint Approved!</p>
                    <p className="text-emerald-300/70 text-xs">
                      EARN 6x times profit as you luckily encounter a PREMIUM PRODUCT
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Balance Display - Show negative until submitted */}
              <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400 text-sm">Current Balance:</span>
                <span className={`font-bold ${displayBalance < 0 ? 'text-red-400' : 'text-white'}`}>
                  ${displayBalance.toFixed(2)}
                </span>
              </div>
              
              {/* Ready to Submit Section - Compact */}
              <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-medium text-xs">Premium Product Ready</span>
                </div>
                <p className="text-amber-300/70 text-xs">
                  Click "Submit Checkpoint Product" on your task card to earn <span className="text-emerald-400 font-bold">${checkpoint.bonus_amount.toFixed(2)}</span>
                </p>
              </div>
              
              {/* Close Button for Approved State */}
              {onClose && (
                <Button 
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all text-sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Close & Return to Tasks
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Phase2Checkpoint;
