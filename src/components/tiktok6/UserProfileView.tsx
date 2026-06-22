import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, UserPlus } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  subtext: string;
  buttonLabel: string;
}

const seedFriends: Friend[] = [
  { id: '1', name: "Ben jerry west", subtext: "Follows you", buttonLabel: "Follow back" },
  { id: '2', name: "Sery Lang En...", subtext: "Friends with...", buttonLabel: "Follow back" },
  { id: '3', name: "babybryan", subtext: "Friends with...", buttonLabel: "Follow" },
  { id: '4', name: "Gold 💞", subtext: "Friends with...", buttonLabel: "Follow" },
  { id: '5', name: "Heom Kundy", subtext: "Friends with...", buttonLabel: "Follow" },
];

export const FollowFriendsPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const handleToggleFollow = (id: string) => {
    setFollowing(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/50 w-full max-w-sm rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4 text-white">Follow your friends</h2>
        <div className="space-y-4">
          {seedFriends.map(friend => (
            <div key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-slate-700">
                  <AvatarFallback className="bg-slate-800 text-white">{friend.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-white">{friend.name}</div>
                  <div className="text-xs text-slate-400">{friend.subtext}</div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant={following[friend.id] ? "outline" : "default"}
                className={following[friend.id] ? "border-slate-600 text-slate-300" : "bg-indigo-600 hover:bg-indigo-500"}
                onClick={() => handleToggleFollow(friend.id)}
              >
                {following[friend.id] ? "Following" : friend.buttonLabel}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface UserProfileViewProps {
  onClose?: () => void;
}

const UserProfileView: React.FC<UserProfileViewProps> = () => {
  const [showFollowPopup, setShowFollowPopup] = useState(true);

  return (
    <div 
      className="flex flex-col h-full text-white relative"
      style={{
        backgroundImage: "url('/designs/cyber-background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh"
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center p-4">
          <UserPlus size={24} className="text-indigo-400" />
          <div className="text-lg font-bold uppercase tracking-widest">My Profile</div>
          <Settings size={24} className="text-indigo-400" />
        </div>

        <div className="flex flex-col items-center py-6">
          <div className="relative">
            <Avatar className="w-24 h-24 border-4 border-slate-900 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <AvatarImage src="/avatar-placeholder.png" />
              <AvatarFallback className="bg-slate-800 text-white">ME</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border-2 border-slate-900">
              +
            </div>
          </div>
          <h2 className="mt-2 text-xl font-semibold tracking-wider">User Name</h2>
        </div>

        <div className="flex justify-around py-4 border-y border-slate-700/50 bg-slate-900/30">
          <div className="flex flex-col items-center">
            <span className="font-bold">128</span>
            <span className="text-xs text-slate-400 uppercase">Likes</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold">85</span>
            <span className="text-xs text-slate-400 uppercase">Followers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold">42</span>
            <span className="text-xs text-slate-400 uppercase">Following</span>
          </div>
        </div>

        <div className="flex justify-around py-4 border-b border-slate-700/50 bg-slate-900/30">
          <div className="flex flex-col items-center p-2 rounded-xl border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <span className="font-bold text-lg text-emerald-400">$0.00</span>
            <span className="text-[10px] text-slate-300 uppercase tracking-widest">USDT Balance</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]">
            <span className="font-bold text-lg text-pink-400">550</span>
            <span className="text-[10px] text-slate-300 uppercase tracking-widest">NC COINS Pool</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 flex-1">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-[9/16] bg-slate-800/50 flex items-center justify-center text-[10px] border border-slate-700/30">
              {Math.floor(Math.random() * 2000)} views
            </div>
          ))}
        </div>

        <Button className="m-4 bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]" onClick={() => setShowFollowPopup(true)}>
          Show Friends
        </Button>

        {showFollowPopup && <FollowFriendsPopup onClose={() => setShowFollowPopup(false)} />}
      </div>
    </div>
  );
};

export default UserProfileView;
