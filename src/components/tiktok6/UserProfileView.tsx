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
    <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-sm rounded-lg shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-4">Follow your friends</h2>
        <div className="space-y-4">
          {seedFriends.map(friend => (
            <div key={friend.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>{friend.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{friend.name}</div>
                  <div className="text-xs text-muted-foreground">{friend.subtext}</div>
                </div>
              </div>
              <Button 
                size="sm" 
                variant={following[friend.id] ? "outline" : "default"}
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
    <div className="flex flex-col h-full bg-background text-foreground relative">
      <div className="flex justify-between items-center p-4">
        <UserPlus size={24} />
        <div className="text-lg font-bold">My Profile</div>
        <Settings size={24} />
      </div>

      <div className="flex flex-col items-center py-6">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background">
            <AvatarImage src="/avatar-placeholder.png" />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background">
            +
          </div>
        </div>
        <h2 className="mt-2 text-xl font-semibold">User Name</h2>
      </div>

      <div className="flex justify-around py-4 border-y">
        <div className="flex flex-col items-center">
          <span className="font-bold">128</span>
          <span className="text-xs text-muted-foreground">Likes</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">85</span>
          <span className="text-xs text-muted-foreground">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold">42</span>
          <span className="text-xs text-muted-foreground">Following</span>
        </div>
      </div>

      {/* Wallet Display Layer */}
      <div className="flex justify-around py-4 border-b bg-card/50">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-primary">$0.00</span>
          <span className="text-xs text-muted-foreground uppercase">USDT Balance</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-amber-500">550</span>
          <span className="text-xs text-muted-foreground uppercase">NC COINS Pool</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 flex-1">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="aspect-[9/16] bg-muted animate-pulse flex items-center justify-center text-xs">
            {Math.floor(Math.random() * 2000)} views
          </div>
        ))}
      </div>

      <Button className="m-4" onClick={() => setShowFollowPopup(true)}>
        Show Friends
      </Button>

      {showFollowPopup && <FollowFriendsPopup onClose={() => setShowFollowPopup(false)} />}
    </div>
  );
};

export default UserProfileView;
