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
    const targetUrl = url || window.location.href;

    if (navigator.share && navigator.canShare && navigator.canShare({ url: targetUrl })) {
      try {
        await navigator.share({
          title,
          text: 'Executive Media Export from earnings.ink',
          url: targetUrl,
          ...(file && { files: [file] }),
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.log('Native share dismissed or failed:', err);
      }
    }

    const encodedUrl = encodeURIComponent(targetUrl);
    const shareText = encodeURIComponent('Check out this Executive Media Stream on earnings.ink');

    const platform = prompt(
      "Choose platform to share:\n1. Telegram\n2. TikTok / Instagram (Copy Link)\n3. Copy Direct Link to Clipboard",
      '1'
    );

    if (platform === '1') {
      window.open(`https://t.me/share/url?url=${encodedUrl}&text=${shareText}`, '_blank');
    } else if (platform === '2' || platform === '3') {
      try {
        await navigator.clipboard.writeText(targetUrl);
        alert('Link copied to clipboard! You can now paste it directly into TikTok, Instagram, or Bluetooth transfers.');
      } catch (err) {
        setShareError('Clipboard access denied. Please copy the URL manually.');
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
