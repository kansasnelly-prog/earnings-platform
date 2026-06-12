import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Home as HomeIcon, Play, FileText, Headphones, Award, HelpCircle, Info, ChevronRight, Bell, Menu } from 'lucide-react';

const Home: React.FC = () => {
  const context = useAppContext();
  const { user, setActiveTab } = context;
  
  // Safety wrapper for setActiveTab
  const safeSetActiveTab = (tab: string) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tab);
    } else {
      console.error('setActiveTab is not a function', context);
    }
  };

  const quickActions = [
    { icon: Headphones, label: 'Customer Care', color: 'bg-blue-500', action: () => window.open('https://t.me/EARNINGSLLCONLINECS1', '_blank') },
    { icon: Award, label: 'Certificate', color: 'bg-purple-500', action: () => safeSetActiveTab('profile') },
    { icon: HelpCircle, label: 'FAQ', color: 'bg-green-500', action: () => alert('FAQ coming soon!') },
    { icon: Info, label: 'About Us', color: 'bg-orange-500', action: () => alert('About Us coming soon!') },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] pb-24">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-medium">Personal</span>
        </div>
        <button className="p-2 bg-gray-800 rounded-lg">
          <Menu className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Banner Image */}
      <div className="px-4 mb-4">
        <div className="relative rounded-2xl overflow-hidden h-48">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" 
            alt="Platform Banner"
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live Platform</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrolling Notice */}
      <div className="bg-gradient-to-r from-amber-900/50 to-yellow-900/50 border-y border-amber-700/30 py-2 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="text-amber-400 text-sm mx-4">
            📢 Dear user, please note that our platform operates 24/7 for serious members. 
            📢 Dear user, please note that our platform operates 24/7 for serious members.
            📢 Dear user, please note that our platform operates 24/7 for serious members.
          </span>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.display_name || 'User'}
          </h1>
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-full">
            <Award className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">VIP{user?.vip_level || 1}</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="flex flex-col items-center gap-2 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-gray-300 text-xs text-center">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Membership Level Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">Membership Level</span>
            <button 
              onClick={() => safeSetActiveTab('profile')}
              className="text-cyan-400 text-sm flex items-center gap-1 hover:text-cyan-300"
            >
              View More <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">VIP{user?.vip_level || 1} {user?.account_type === 'training' ? 'Training' : 'Member'}</p>
              <p className="text-gray-400 text-sm">Current Level</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Total Balance</p>
            <p className="text-green-400 text-xl font-bold">${(user?.balance ?? 0).toFixed(2)}</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-400 text-sm mb-1">Tasks Done</p>
            <p className="text-blue-400 text-xl font-bold">{user?.tasks_completed || 0}/{user?.account_type === 'training' ? 45 : (user?.total_tasks || 35)}</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 w-full max-w-[450px] mx-auto z-50 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button 
            onClick={() => safeSetActiveTab('dashboard')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <HomeIcon className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          
          <button 
            onClick={() => {
              safeSetActiveTab('tasks');
            }}
            className="flex flex-col items-center gap-1 relative -top-4"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30">
              <Play className="w-8 h-8 ml-1 text-white" />
            </div>
            <span className="text-xs font-medium text-white">Start</span>
          </button>
          
          <button 
            onClick={() => safeSetActiveTab('profile')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors"
          >
            <FileText className="w-6 h-6" />
            <span className="text-xs">Record</span>
          </button>
        </div>
      </div>

      {/* Add marquee animation style */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Home;
