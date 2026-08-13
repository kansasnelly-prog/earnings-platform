import React, { useState, useEffect } from 'react';

export const ScreenShareWidget: React.FC = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setScreenStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setScreenStream(null);
        };
      }
    } catch (err) {
      console.error('Screen sharing canceled or failed:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  return (
    <button
      onClick={startScreenShare}
      className="executive-rainbow-border"
      style={{
        padding: '10px 18px',
        color: '#fff',
        cursor: 'pointer',
        borderRadius: '8px',
        background: '#0f172a',
        fontWeight: 'bold',
        border: '2px solid',
      }}
    >
      🖥️ SHARE REAL-TIME SCREEN / DEVICE CAMERA (PERSISTENT)
    </button>
  );
};
