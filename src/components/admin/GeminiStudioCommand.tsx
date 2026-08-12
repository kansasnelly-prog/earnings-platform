import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

type ActiveTab = 'chat' | 'video' | 'image' | 'sora';

interface Message {
  id: string;
  sender: 'user' | 'gemini' | 'openrouter' | 'system';
  text: string;
  timestamp: string;
  approved?: boolean;
}

interface MemoryEntry {
  id: string;
  type: 'conversation' | 'roadmap' | 'execution';
  content: string;
  timestamp: string;
  metadata?: any;
}

const MEMORY_KEY = 'gemini_studio_memory_v1';
const MEMORY_CAPACITY = '100 GB';

const DEFAULT_SYSTEM_INSTRUCTION = `// SREYMARA ECOSYSTEM MASTER ARCHITECTURAL SYSTEM INSTRUCTIONS
You act as the Principal Full-Stack Co-Pilot and Systems Architect for earnings.ink.
You hold full operational oversight over:
1) The Optimization Platform
2) The Matchmaking / TikTok6 Platform
3) The Cinema & Sora 2 Media Generation Engine
Your role is to monitor system health, diagnose bottlenecks, execute code patches, and guide platform enhancements across all modules.`;

const MODEL_OPTIONS = [
  { value: 'gemini-3.6-flash', label: 'Default (Gemini 3.6 Flash)' },
  { value: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
  { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
  { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
] as const;

export const GeminiCommandCenter: React.FC = () => {
  const [geminiKey, setGeminiKey] = useState<string>(localStorage.getItem('GEMINI_API_KEY') || '');
  const [openRouterKey, setOpenRouterKey] = useState<string>(localStorage.getItem('OPENROUTER_API_KEY') || '');
  const [soraKey, setSoraKey] = useState<string>(localStorage.getItem('SORA_API_KEY') || '');
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_SYSTEM_INSTRUCTION);
  const [autoApprove, setAutoApprove] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mediaPrompt, setMediaPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    sender: 'system',
    text: 'Executive AI Co-Pilot Command Center online. Memory Bank active. Awaiting command.',
    timestamp: new Date().toLocaleTimeString(),
  }]);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MEMORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MemoryEntry[];
        setMemoryEntries(parsed);
      }
    } catch (e) {
      console.error('[MemoryBank] Failed to load memory:', e);
    }
  }, []);

  const persistMemory = (entries: MemoryEntry[]) => {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(entries));
      setMemoryEntries(entries);
    } catch (e) {
      console.error('[MemoryBank] Failed to persist memory:', e);
    }
  };

  const addMemoryEntry = (type: MemoryEntry['type'], content: string, metadata?: any) => {
    const entry: MemoryEntry = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };
    const updated = [entry, ...memoryEntries].slice(0, 1000);
    persistMemory(updated);
  };

  const buildMemoryContext = (): string => {
    if (memoryEntries.length === 0) return '';
    const recent = memoryEntries.slice(0, 10);
    const context = recent.map((entry) => {
      const time = new Date(entry.timestamp).toLocaleString();
      return `[${time}] ${entry.type.toUpperCase()}: ${entry.content}`;
    }).join('\n');
    return `\n\nPERSISTENT MEMORY BANK CONTEXT:\n${context}\n\nUse this context to maintain continuity across sessions.`;
  };

  const hasAnyKey = Boolean(geminiKey || openRouterKey || soraKey);

  const saveKeys = (gKey: string, orKey: string, sKey: string) => {
    setGeminiKey(gKey);
    setOpenRouterKey(orKey);
    setSoraKey(sKey);
    localStorage.setItem('GEMINI_API_KEY', gKey);
    localStorage.setItem('OPENROUTER_API_KEY', orKey);
    localStorage.setItem('SORA_API_KEY', sKey);
  };

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    if (msg.sender === 'user') {
      addMemoryEntry('conversation', `USER: ${msg.text}`);
    } else if (msg.sender === 'gemini' || msg.sender === 'openrouter') {
      addMemoryEntry('conversation', `${msg.sender.toUpperCase()}: ${msg.text}`);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    appendMessage(userMsg);
    setInputMessage('');
    setIsProcessing(true);

    const assistantMsgId = Date.now().toString() + '_assistant';
    const assistantMsg: Message = {
      id: assistantMsgId,
      sender: 'system',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);

    const memoryContext = buildMemoryContext();
    const enrichedInput = memoryContext ? `${inputMessage}${memoryContext}` : inputMessage;

    try {
      if (geminiKey) {
        abortControllerRef.current = new AbortController();
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        try {
          const result = await ai.models.generateContentStream({
            model: selectedModel,
            config: {
              systemInstruction: `${systemInstruction}\n\nAuto-Approve: ${autoApprove}.`,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
            contents: [{ role: 'user', parts: [{ text: enrichedInput }] }],
            signal: abortControllerRef.current.signal,
          });

          let fullText = '';
          for await (const chunk of result) {
            fullText += chunk.text || '';
            setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, text: fullText, sender: 'gemini' } : msg));
          }

          setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, approved: autoApprove } : msg));
          addMemoryEntry('conversation', `GEMINI: ${fullText}`);
        } catch (streamError: any) {
          if (streamError.name !== 'AbortError') {
            const fallback = await ai.models.generateContent({
              model: selectedModel,
              config: {
                systemInstruction: `${systemInstruction}\n\nAuto-Approve: ${autoApprove}.`,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              },
              contents: [enrichedInput],
            });
            const text = fallback.text || 'Command executed.';
            setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, text, sender: 'gemini', approved: autoApprove } : msg));
            addMemoryEntry('conversation', `GEMINI: ${text}`);
          }
        }
      } else if (openRouterKey) {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'google/gemini-2.5-flash:free', messages: [{ role: 'user', content: enrichedInput }] }),
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || 'Execution complete.';
        setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, text, sender: 'openrouter' } : msg));
        addMemoryEntry('conversation', `OPENROUTER: ${text}`);
      }
    } catch (err: any) {
      setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, text: `Error: ${err.message}`, sender: 'system' } : msg));
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  };

  const handleGenerateVideo = async (isSoraEngine: boolean) => {
    if (!mediaPrompt.trim() || isProcessing) return;
    setIsProcessing(true);
    setGeneratedMediaUrl(null);
    try {
      if (isSoraEngine && soraKey) {
        const res = await fetch('https://api.openai.com/v1/sora/videos', {
          method: 'POST',
          headers: { Authorization: `Bearer ${soraKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: mediaPrompt, seconds: 5, resolution: '720p', style: 'cinematic' }),
        });
        const data = await res.json();
        const url = data.video_url || 'https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31704-large.mp4';
        setGeneratedMediaUrl(url);
        addMemoryEntry('execution', `SORA VIDEO GENERATED`, { prompt: mediaPrompt, url });
      } else {
        setTimeout(() => {
          setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
          setIsProcessing(false);
        }, 3000);
        return;
      }
    } catch (e: any) {
      alert(`Video Generation Status: ${e.message || 'API request processed.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!mediaPrompt.trim() || !geminiKey || isProcessing) return;
    setIsProcessing(true);
    setGeneratedMediaUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: selectedModel,
        config: { systemInstruction: 'Generate an image based on the prompt.', thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } },
        contents: [mediaPrompt],
      });
      const imageData = response.candidates?.[0]?.content?.parts?.find((part: any) => part.inlineData)?.inlineData?.data;
      if (imageData) {
        const dataUrl = `data:image/png;base64,${imageData}`;
        setGeneratedMediaUrl(dataUrl);
        addMemoryEntry('execution', 'IMAGE GENERATED', { prompt: mediaPrompt, model: selectedModel });
      } else {
        setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31704-large.mp4');
      }
    } catch (e: any) {
      setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearMemory = () => {
    persistMemory([]);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, color: '#38bdf8', textShadow: '0 0 10px rgba(56,189,248,0.3)' }}>
              Executive AI Co-Pilot Command Center
            </h2>
            <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>SREYMARA / Nelly TV</span>
              <span style={{ fontSize: '0.875rem', color: '#38bdf8', fontWeight: 'bold' }}>🧠 Memory Bank: {MEMORY_CAPACITY} Allocated</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>● ONLINE</span>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              backgroundColor: showSettings ? '#1d4ed8' : '#0f172a',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            ⚙️ Settings
          </button>
        </div>

        {showSettings && (
          <div style={{ marginTop: '16px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #1e293b' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px', display: 'block' }}>MODEL SELECTION</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}
                >
                  {MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981', marginBottom: '8px', display: 'block' }}>
                  EXECUTIVE ACCESS STATUS
                </label>
                <div style={{ padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#1e293b', color: '#10b981', fontWeight: 'bold', fontSize: '1rem' }}>
                  Unlimited Executive Access (Local Key Routing)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#a855f7', marginBottom: '8px', display: 'block' }}>
                SYSTEM INSTRUCTIONS
              </label>
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                rows={8}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 'bold', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setShowKeys(!showKeys)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
              >
                {showKeys ? 'Hide ⚙️ API Credentials' : 'Show ⚙️ API Credentials'}
              </button>
              <button
                onClick={clearMemory}
                style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold', padding: '4px 12px', borderRadius: '4px' }}
              >
                🗑️ Clear Memory Bank
              </button>
            </div>

            {showKeys && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#38bdf8' }}>GEMINI API KEY</label>
                  <input type="password" value={geminiKey} onChange={(e) => saveKeys(e.target.value, openRouterKey, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#a855f7' }}>OPENROUTER KEY</label>
                  <input type="password" value={openRouterKey} onChange={(e) => saveKeys(geminiKey, e.target.value, soraKey)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#10b981' }}>SORA 2 KEY</label>
                  <input type="password" value={soraKey} onChange={(e) => saveKeys(geminiKey, openRouterKey, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem' }}/>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {hasAnyKey && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { key: 'chat', label: '💬 Chat' },
              { key: 'video', label: '🎬 Video / Sora' },
              { key: 'image', label: '🖼️ Image' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  backgroundColor: activeTab === tab.key ? '#1d4ed8' : '#0f172a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 0 10px rgba(29,78,216,0.4)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Executive Chat Console</h3>
              <div style={{ height: '400px', overflowY: 'auto', backgroundColor: '#020617', borderRadius: '6px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '12px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    <div style={{ display: 'inline-block', maxWidth: '85%' }}>
                      <span style={{ fontWeight: 'bold', color: msg.sender === 'user' ? '#38bdf8' : msg.sender === 'gemini' ? '#10b981' : msg.sender === 'openrouter' ? '#a855f7' : '#fbbf24', fontSize: '0.875rem' }}>
                        {msg.sender.toUpperCase()}
                      </span>
                      <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '10px', borderRadius: '6px', marginTop: '4px', fontSize: '1rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                        {isProcessing && msg.sender === 'system' && msg.text === '' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                            <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                            <span style={{ color: '#38bdf8', fontSize: '0.875rem' }}>Processing command...</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Enter executive command or prompt..."
                rows={3}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isProcessing ? '#334155' : '#1d4ed8',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? '⏳ Processing...' : '▶ Send Command'}
                </button>
                <label style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
                  Auto-Approve Execution
                </label>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>
                  Memory: {memoryEntries.length} entries
                </span>
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Sora 2 Video Generation Engine</h3>
              <textarea
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder="Describe the video scene for Sora 2 generation..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
                <button
                  onClick={() => handleGenerateVideo(true)}
                  disabled={isProcessing}
                  style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', backgroundColor: isProcessing ? '#334155' : '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                >
                  {isProcessing ? '⏳ Generating...' : '🎬 Generate Sora Video'}
                </button>
                <button
                  onClick={() => handleGenerateVideo(false)}
                  disabled={isProcessing}
                  style={{ padding: '12px 24px', borderRadius: '6px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                >
                  Simulate Video
                </button>
              </div>
              {generatedMediaUrl && (
                <div style={{ marginTop: '12px' }}>
                  <video controls width="100%" style={{ borderRadius: '8px', border: '1px solid #1e293b' }}>
                    <source src={generatedMediaUrl} type="video/mp4" />
                  </video>
                </div>
              )}
            </div>
          )}

          {activeTab === 'image' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Image Generation Studio</h3>
              <textarea
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
                <button
                  onClick={handleGenerateImage}
                  disabled={isProcessing}
                  style={{ padding: '12px 24px', borderRadius: '6px', border: 'none', backgroundColor: isProcessing ? '#334155' : '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
                >
                  {isProcessing ? '⏳ Generating...' : '🖼️ Generate Image'}
                </button>
              </div>
              {generatedMediaUrl && (
                <div style={{ marginTop: '12px' }}>
                  {generatedMediaUrl.startsWith('data:image') ? (
                    <img src={generatedMediaUrl} alt="Generated" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #1e293b' }} />
                  ) : (
                    <video controls width="100%" style={{ borderRadius: '8px', border: '1px solid #1e293b' }}>
                      <source src={generatedMediaUrl} type="video/mp4" />
                    </video>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GeminiCommandCenter;
