import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Switch, LayoutDashboard, Heart } from 'lucide-react';

const MASTER_ADMIN_EMAIL = 'kansasnelly@gmail.com';

const PlatformSwitch: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPlatform, setCurrentPlatform] = useState<'optimization' | 'dating'>(
    location.pathname.startsWith('/admin') ? 'optimization' : 'dating'
  );

  const handleSwitch = (platform: 'optimization' | 'dating') => {
    setCurrentPlatform(platform);
    
    if (platform === 'optimization') {
      navigate('/admin');
    } else {
      navigate('/match-feed');
    }
  };

  // Only show platform switch for master admin
  const userEmail = localStorage.getItem('user_email');
  if (userEmail !== MASTER_ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2 shadow-2xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleSwitch('optimization')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
            currentPlatform === 'optimization'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-semibold text-sm">Optimization</span>
        </button>
        
        <button
          onClick={() => handleSwitch('dating')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
            currentPlatform === 'dating'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
              : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
          }`}
        >
          <Heart size={18} />
          <span className="font-semibold text-sm">TIKTOK6 Dating</span>
        </button>
      </div>
    </div>
  );
};

export default PlatformSwitch;
