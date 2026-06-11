import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{users: any[], videos: any[]}>({users: [], videos: []});

  const handleSearch = async () => {
    const { data: users } = await supabase.from('user_profiles').select('*').or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
    const { data: videos } = await supabase.from('creator_videos').select('*').ilike('caption', `%${query}%`);
    setResults({users: users || [], videos: videos || []});
  };

  return (
    <div className="p-4 text-white">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-full p-2 bg-gray-800" />
      <button onClick={handleSearch} className="bg-indigo-600 p-2 mt-2 w-full">Search</button>
      <h3 className="mt-4">Users</h3>
      {results.users.map(u => <div key={u.id}>{u.display_name}</div>)}
      <h3 className="mt-4">Videos</h3>
      {results.videos.map(v => <div key={v.id}>{v.caption}</div>)}
    </div>
  );
};

export default Search;
