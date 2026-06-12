import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Video } from '@/hooks/useTikTokFeed';

interface Profile {
  username: string;
  display_name: string;
  bio: string;
  followers_count: number;
  following_count: number;
  videos_count: number;
  likes_count: number;
}

import { useParams } from 'react-router-dom';

const CreatorProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const creatorId = userId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState<'videos' | 'likes'>('videos');

  useEffect(() => {
    const fetchData = async () => {
      const { data: profileData } = await supabase.from('user_profiles').select('*').eq('user_id', creatorId).single();
      const { data: videoData } = await supabase.from('creator_videos').select('*').eq('creator_id', creatorId);
      
      if (profileData) setProfile(profileData);
      if (videoData) setVideos(videoData);
    };
    fetchData();
  }, [creatorId]);

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="p-4 text-white min-h-[500px]">
      <h1 className="text-2xl font-bold">{profile.display_name}</h1>
      <p className="text-gray-400">@{profile.username}</p>
      <div className="flex gap-4 mt-2">
        <span>{profile.followers_count} Followers</span>
        <span>{profile.following_count} Following</span>
        <span>{profile.likes_count} Likes</span>
      </div>
      <p className="mt-2">{profile.bio}</p>
      
      <div className="flex gap-4 mt-4 border-b border-gray-700">
        <button onClick={() => setTab('videos')} className={`pb-2 ${tab === 'videos' ? 'border-b-2 border-white' : ''}`}>Videos</button>
        <button onClick={() => setTab('likes')} className={`pb-2 ${tab === 'likes' ? 'border-b-2 border-white' : ''}`}>Likes</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        {tab === 'videos' && videos.map(v => <img key={v.id} src={v.thumbnail_url} alt="video" className="aspect-square bg-gray-800" />)}
        {tab === 'likes' && <p className="text-gray-400">Liked videos not implemented yet</p>}
      </div>
    </div>
  );
};

export default CreatorProfile;
