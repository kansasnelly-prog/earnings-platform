import React, { useState, useRef } from 'react';

export const ExecutiveMediaStudio: React.FC = () => {
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleCapture = async (facingMode: 'user' | 'environment') => {
    setCaptureError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: true,
      });
      setPreviewStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access error';
      setCaptureError(message);
    }
  };

  const handleShare = async (title: string, url: string, file?: File) => {
    setShareError(null);
    if (!navigator.share) {
      setShareError('Web Share API not supported on this browser.');
      return;
    }
    try {
      const payload: ShareData = { title, text: 'Executive Media Export', url };
      if (file) {
        payload.files = [file];
      }
      await navigator.share(payload);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setShareError(err.message);
      }
    }
  };

  return (
    <div className="executive-rainbow-border" style={{ padding: '16px', borderRadius: '12px', marginTop: '12px' }}>
      <h3 className="executive-rainbow-text" style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '12px' }}>
        📷 Executive Live Media & Stream Capture
      </h3>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <button
          onClick={() => handleCapture('user')}
          className="executive-rainbow-border"
          style={{ padding: '10px 14px', borderRadius: '8px', color: '#fff', background: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🤳 Selfie / Front Cam
        </button>
        <button
          onClick={() => handleCapture('environment')}
          className="executive-rainbow-border"
          style={{ padding: '10px 14px', borderRadius: '8px', color: '#fff', background: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📸 High-End Back Cam
        </button>
        <button
          onClick={() => handleShare('Executive Content', window.location.href)}
          className="executive-rainbow-border"
          style={{ padding: '10px 14px', borderRadius: '8px', color: '#fff', background: '#0f172a', cursor: 'pointer', fontWeight: 'bold' }}
        >
          📲 Share to TikTok / IG / Telegram / Bluetooth
        </button>
      </div>

      {previewStream && (
        <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', maxHeight: '320px', background: '#000' }} />
        </div>
      )}

      {captureError && (
        <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          Camera error: {captureError}
        </div>
      )}
      {shareError && (
        <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '0.85rem' }}>
          Share error: {shareError}
        </div>
      )}
    </div>
  );
};
