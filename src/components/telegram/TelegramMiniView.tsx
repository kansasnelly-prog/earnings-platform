import React, { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';

/**
 * TelegramMiniView
 *
 * A lightweight front‑end terminal that mimics a mini Telegram UI.
 * It contains two independent panels:
 *   1️⃣ NC AI x Engine – a simple text inquiry input with an action button.
 *   2️⃣ Dual‑Telegram Terminal – status rows for a primary wallet session and a backup session.
 *
 * The component follows the project's existing Tailwind dark‑theme conventions
 * and does not introduce any new global providers or backend services.
 */
const TelegramMiniView: React.FC = () => {
  // Query input for the AI engine panel
  const [query, setQuery] = useState('');

  // Placeholder session status values – in a real implementation these would be
  // derived from the user's wallet / Telegram connection state.
  const [primaryStatus] = useState('Connected');
  const [backupStatus] = useState('Disconnected');

  const handleQuery = () => {
    // In production this would call the AI service; for now we simply log.
    console.log('AI query:', query);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 gap-8">
      {/* Panel A – NC AI x Engine */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🤖 NC AI x Engine
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask a question…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleQuery}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
            Analyze
          </button>
        </div>
      </div>

      {/* Panel B – Dual‑Telegram Terminal */}
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          👥 Dual‑Telegram Terminal
        </h2>
        <div className="space-y-3">
          {/* Primary Wallet session */}
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-indigo-400" />
              <span>Primary Wallet</span>
            </div>
            <span className={`font-medium ${primaryStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}> {primaryStatus} </span>
          </div>
          {/* Backup session */}
          <div className="flex items-center justify-between p-3 bg-slate-800 rounded-md">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} className="text-indigo-400" />
              <span>Backup Session</span>
            </div>
            <span className={`font-medium ${backupStatus === 'Connected' ? 'text-green-400' : 'text-red-400'}`}> {backupStatus} </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramMiniView;
