import React, { useState } from 'react';
import { supabaseMain } from '@/lib/supabaseClient';

declare global {
  interface Window {
    Adsgram?: {
      init: (params: { blockId: string; debug?: boolean }) => {
        show: () => Promise<{ done: boolean }>;
      };
    };
  }
}

const AdsgramRewardedVideo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const triggerAdsgramWebhook = async (userId: string) => {
    try {
      await fetch(`https://earnings-ink.vercel.app/api/webhooks/adsgram?userid=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (e) {
      console.error('Failed to trigger Adsgram webhook:', e);
    }
  };

  const handleWatchAd = async () => {
    if (!window.Adsgram) {
      setStatus('Adsgram SDK not loaded. Please open inside Telegram.');
      return;
    }

    setLoading(true);
    setStatus('Loading ad...');

    try {
      const AdController = window.Adsgram.init({
        blockId: '44761',
        debug: false,
      });

      const result = await AdController.show();

      if (result.done) {
        setStatus('Reward granted! Thank you for watching.');
        console.log('Adsgram ad completed:', result);

        const { data: { user } } = await supabaseMain.auth.getUser();
        if (user?.id) {
          await triggerAdsgramWebhook(user.id);
        }
      } else {
        setStatus('Ad was closed before finishing.');
      }
    } catch (error) {
      console.error('Adsgram playback error:', error);
      setStatus('No ads available right now or ad was skipped.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
      <h3 className="text-lg font-bold mb-2">Watch & Earn</h3>
      <p className="text-sm text-slate-400 mb-4">
        Watch a short video ad to support the platform and earn rewards!
      </p>

      <button
        onClick={handleWatchAd}
        disabled={loading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <span>Loading Ad...</span>
        ) : (
          <span>Watch Video Ad (+Reward)</span>
        )}
      </button>

      {status && (
        <p className="mt-3 text-xs text-center text-slate-300">
          {status}
        </p>
      )}
    </div>
  );
};

export default AdsgramRewardedVideo;
