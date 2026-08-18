import React, { useState } from 'react';
import GlitterBlock from './GlitterBlock';

type StyleMode = 'create' | 'short' | 'formal' | 'tribal' | 'corp' | 'biblical' | 'viking' | 'zen';
type EngineMode = 'gemini' | 'robotic' | 'streamlined';

const AIEditorToolbar: React.FC = () => {
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<StyleMode>('create');
  const [engine, setEngine] = useState<EngineMode>('gemini');
  const [output, setOutput] = useState('');

  const styles: { id: StyleMode; label: string }[] = [
    { id: 'create', label: 'Create' },
    { id: 'short', label: 'Short' },
    { id: 'formal', label: 'Formal' },
    { id: 'tribal', label: 'Tribal' },
    { id: 'corp', label: 'Corp' },
    { id: 'biblical', label: 'Biblical' },
    { id: 'viking', label: 'Viking' },
    { id: 'zen', label: 'Zen' },
  ];

  const handleAction = async (action: 'translate' | 'style' | 'fix' | 'gemini') => {
    if (!input.trim()) {
      setOutput('[ERROR] Please enter text or upload content first.');
      return;
    }

    setOutput(`[${action.toUpperCase()}] Processing with ${engine} engine...`);

    try {
      const response = await fetch('/api/ai/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          engine,
          input: input.trim(),
          userId: 'current-user',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOutput(data.output || `[${action.toUpperCase()}] Done.`);
      } else {
        setOutput(`[${action.toUpperCase()}] Service unavailable.`);
      }
    } catch (error) {
      console.error('[AIEditorToolbar] Action failed:', error);
      setOutput(`[${action.toUpperCase()}] Network error.`);
    }
  };

  return (
    <GlitterBlock glowColor="gold" padding="md">
      <div className="text-[10px] text-yellow-400 tracking-[0.2em] uppercase font-bold mb-3">
        AI Editor — {engine.toUpperCase()} Engine
      </div>

      {/* Engine Selector */}
      <div className="flex gap-1 mb-3">
        {(['gemini', 'robotic', 'streamlined'] as EngineMode[]).map((eng) => (
          <button
            key={eng}
            onClick={() => setEngine(eng)}
            className={`
              flex-1 py-1.5 text-[9px] font-bold tracking-wider uppercase border transition-all
              ${engine === eng
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }
            `}
          >
            {eng}
          </button>
        ))}
      </div>

      {/* Text Input */}
      <textarea
        placeholder="Enter text or upload image..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="w-full bg-slate-900/60 border border-slate-700 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 transition-colors mb-3 resize-none"
      />

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {(['translate', 'style', 'fix', 'gemini'] as const).map((action) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            className="py-2 bg-slate-800/60 border border-slate-700 text-slate-300 text-[9px] font-bold tracking-widest uppercase hover:border-yellow-500/50 hover:text-yellow-400 transition-all"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Style Selector */}
      <div className="flex flex-wrap gap-1 mb-3">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => setStyle(s.id)}
            className={`
              px-2 py-1 text-[9px] font-bold tracking-wider uppercase border transition-all
              ${style === s.id
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:border-slate-600'
              }
            `}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Output */}
      {output && (
        <div className="bg-slate-900/40 border border-slate-700 p-3">
          <div className="text-[10px] text-slate-500 mb-1">Output</div>
          <div className="text-xs text-slate-300">{output}</div>
        </div>
      )}
    </GlitterBlock>
  );
};

export default AIEditorToolbar;
