import React, { useState } from 'react';
import GlitterBlock from '../GlitterBlock';

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

const ActiveTab: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'System', content: 'Active connections will appear here.', timestamp: '00:00', isOwn: false },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full py-1">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] text-slate-600 tracking-[0.3em] uppercase font-black">Active Connections</div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 sreymara-mono">3 Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 sreymara-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <GlitterBlock
              glowColor={msg.isOwn ? 'crimson' : 'teal'}
              padding="sm"
              className={`max-w-[80%] ${msg.isOwn ? 'bg-rose-950/30' : 'bg-slate-900/50'}`}
            >
              {!msg.isOwn && <div className="text-[9px] text-rose-400 font-black mb-1">{msg.sender}</div>}
              <div className="text-xs text-slate-300 leading-relaxed">{msg.content}</div>
              <div className="text-[9px] text-slate-600 mt-1 text-right sreymara-mono">{msg.timestamp}</div>
            </GlitterBlock>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="TYPE A MESSAGE..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-slate-900/70 border border-rose-500/20 px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500/60 transition-colors sreymara-mono uppercase"
        />
        <button
          onClick={handleSend}
          className="px-5 py-2.5 bg-rose-500/18 border border-rose-500/55 text-rose-400 text-xs font-black tracking-widest uppercase hover:bg-rose-500/28 transition-all"
        >
          SEND
        </button>
      </div>
    </div>
  );
};

export default ActiveTab;
