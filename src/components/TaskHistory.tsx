import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { TaskHistory as TaskHistoryType } from '@/contexts/AppContext';
import { DollarSign, Clock, Package } from 'lucide-react';

const TaskHistory: React.FC = () => {
  const { taskHistory } = useAppContext();
  
  const totalEarnings = taskHistory.reduce((sum, item) => sum + item.reward, 0);
  
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (taskHistory.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Task History</h3>
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No completed tasks yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Task History</h3>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-400">${totalEarnings.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {taskHistory.map((item) => (
          <div 
            key={item.id} 
            className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-indigo-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.product_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs text-gray-500">{formatDate(item.completed_at)}</span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <span className="text-sm font-bold text-emerald-400">+${item.reward.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskHistory;
