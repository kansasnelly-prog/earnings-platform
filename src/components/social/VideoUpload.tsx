import React, { useState } from 'react';
import { VideoUploadService } from '@/services/videoUploadService';
import { useAppContext } from '@/contexts/AppContext';

const VideoUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const { user } = useAppContext();

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const result = await VideoUploadService.uploadVideo(file, user.id, caption);
    setUploading(false);
    if (result.success) {
      alert('Upload successful!');
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <input type="text" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" className="w-full p-2 mt-2 bg-gray-800" />
      <button onClick={handleUpload} disabled={uploading || !file} className="bg-indigo-600 p-2 mt-2">
        {uploading ? 'Uploading...' : 'Publish'}
      </button>
    </div>
  );
};

export default VideoUpload;
