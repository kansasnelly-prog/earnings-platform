import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

/**
 * Placeholder component – will be expanded with full UI.
 */
const MatchmakingOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      const { data, error } = await supabase.from('matchmaking_groups').select('*');
      if (error) {
        console.error('Error fetching matchmaking groups:', error);
        setGroups([]);
      } else {
        setGroups(data || []);
      }
      setLoading(false);
    };
    fetchGroups();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl p-6 bg-[#121212]/90 border border-white/10 rounded-xl shadow-2xl text-white overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
          <X size={24} />
        </button>

        {/* Reward banner */}
        <div className="mb-4 p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-center">
          🎉 Welcome Bonus: 50 NC Free Claimed for Real‑Time Chat &amp; Discovery!
        </div>

        {/* Translation buttons */}
        <div className="flex justify-center space-x-2 mb-6">
          <button className="px-3 py-1 bg-white/10 rounded" onClick={() => {/* placeholder */}}>
            🌐 Translate to English
          </button>
          <button className="px-3 py-1 bg-white/10 rounded" onClick={() => {/* placeholder */}}>
            🌐 Translate to Khmer
          </button>
          <button className="px-3 py-1 bg-white/10 rounded" onClick={() => {/* placeholder */}}>
            🌐 Translate to Vietnamese
          </button>
          <button className="px-3 py-1 bg-white/10 rounded" onClick={() => {/* placeholder */}}>
            🌐 Translate to Tagalog
          </button>
        </div>

        {/* Group list */}
        {loading ? (
          <div className="text-center">Loading groups…</div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <div key={group.id} className="p-4 bg-[#121212]/80 border border-white/10 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-1">{group.name}</h3>
                {group.description && <p className="text-sm">{group.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchmakingOverlay;
