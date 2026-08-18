import React, { useState, useRef, useEffect } from 'react';
import GlitterBlock from './GlitterBlock';
import TelegramExecutiveAlertService from '@/services/telegramExecutiveAlertService';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  codeBlocks?: { language: string; code: string }[];
}

const GeminiChatOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [model, setModel] = useState('Flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('[GeminiChat] Copy failed:', error);
    }
  };

  const extractCodeBlocks = (text: string): { language: string; code: string }[] => {
    const matches = text.match(/```(\w+)?\n?([\s\S]*?)```/g) || [];
    return matches.map((block) => {
      const langMatch = block.match(/```(\w+)?\n?/);
      const code = block.replace(/```\w*\n?/, '').replace(/```$/, '');
      return { language: langMatch?.[1] || 'text', code };
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          model,
          userId: 'current-user',
          history: messages.slice(-10),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || data.output || 'No response.',
          timestamp: Date.now(),
          codeBlocks: extractCodeBlocks(data.reply || data.output || ''),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (assistantMessage.codeBlocks && assistantMessage.codeBlocks.length > 0) {
          TelegramExecutiveAlertService.sendYieldAlert(0.0005, `code-gen-${Date.now()}`);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: '[ERROR] AI service unavailable.',
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (error) {
      console.error('[GeminiChat] Send failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: '[ERROR] Network error.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setIsThinking(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMessage.content,
          model,
          userId: 'current-user',
          history: messages.slice(-10),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || data.output || 'No response.',
          timestamp: Date.now(),
          codeBlocks: extractCodeBlocks(data.reply || data.output || ''),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('[GeminiChat] Regenerate failed:', error);
    } finally {
      setIsThinking(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleOpen}
        className="fixed bottom-20 left-3 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:scale-105 transition-transform"
        title="Open Gemini AI Chat"
      >
        <span className="text-white font-black text-sm">G</span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-20 left-3 z-50 px-4 py-2 rounded-full bg-slate-900/90 border border-yellow-500/25 flex items-center gap-2 shadow-lg hover:border-yellow-500/55 transition-all"
        title="Expand Gemini AI Chat"
      >
        <span className="text-yellow-400 font-black text-xs tracking-widest">GEMINI</span>
        <span className="text-yellow-400 text-lg leading-none">⌄</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-16 left-3 right-3 z-50 md:left-auto md:right-4 md:bottom-20 md:w-[22rem] flex flex-col rounded-2xl bg-slate-900/95 border border-yellow-500/25 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-yellow-500/15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-white font-black text-xs">G</div>
          <div>
            <div className="text-[10px] text-yellow-400 font-black tracking-[0.2em] uppercase">Gemini AI</div>
            <div className="text-[9px] text-slate-500">{model} Model</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-slate-800/60 border border-yellow-500/20 text-yellow-300 text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-md focus:outline-none"
          >
            <option value="Flash">Flash</option>
            <option value="Pro">Pro</option>
          </select>
          <button
            onClick={toggleMinimize}
            className="w-6 h-6 rounded-md bg-slate-800/60 border border-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center hover:border-yellow-500/55 transition-all"
            title="Minimize"
          >
            ⌃
          </button>
          <button
            onClick={toggleOpen}
            className="w-6 h-6 rounded-md bg-slate-800/60 border border-yellow-500/20 text-yellow-400 text-xs flex items-center justify-center hover:border-yellow-500/55 transition-all"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[50vh] md:max-h-[40rem] sreymara-scroll">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-[10px] text-slate-600 tracking-[0.3em] uppercase font-black mb-2">Executive AI Assistant</div>
            <div className="text-[10px] text-slate-500">Ask anything. Earn SOL for every interaction.</div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl p-3 ${
              msg.role === 'user'
                ? 'bg-yellow-500/15 border border-yellow-500/30 text-yellow-100'
                : 'bg-slate-800/60 border border-yellow-500/15 text-slate-200'
            }`}>
              {msg.role === 'assistant' && (
                <div className="text-[9px] text-yellow-400 font-black tracking-widest uppercase mb-1">Gemini</div>
              )}
              <div className="text-xs leading-relaxed whitespace-pre-wrap select-text">{msg.content}</div>

              {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.codeBlocks.map((block, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-950 border border-yellow-500/20 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-yellow-500/10">
                        <span className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">{block.language}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyToClipboard(block.code)}
                            className="px-2 py-1 text-[9px] text-yellow-400 border border-yellow-500/25 rounded hover:bg-yellow-500/10 transition-all flex items-center gap-1"
                            title="Copy code"
                          >
                            <span>⎘</span> Copy
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([block.code], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `code-${Date.now()}.${block.language === 'javascript' ? 'js' : block.language}`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-2 py-1 text-[9px] text-yellow-400 border border-yellow-500/25 rounded hover:bg-yellow-500/10 transition-all flex items-center gap-1"
                            title="Download code"
                          >
                            <span>↓</span>
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 text-[11px] text-slate-300 font-mono overflow-x-auto select-text">
                        <code>{block.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {msg.role === 'assistant' && (
                <div className="mt-2 flex items-center gap-1 border-t border-yellow-500/10 pt-2">
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="p-1 text-[9px] text-slate-400 hover:text-yellow-400 transition-colors"
                    title="Copy response"
                  >
                    ⎘
                  </button>
                  <button
                    onClick={() => handleRegenerate(msg.id)}
                    className="p-1 text-[9px] text-slate-400 hover:text-yellow-400 transition-colors"
                    title="Regenerate"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => copyToClipboard(msg.content)}
                    className="p-1 text-[9px] text-slate-400 hover:text-yellow-400 transition-colors"
                    title="Copy full output"
                  >
                    ⎘
                  </button>
                  <span className="text-[9px] text-slate-600 ml-auto sreymara-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-yellow-500/15 rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-yellow-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-yellow-500/15">
        <div className="flex items-center gap-2 bg-slate-900/70 border border-yellow-500/20 rounded-full px-4 py-2">
          <button
            className="text-yellow-400 text-lg leading-none hover:text-yellow-300 transition-colors"
            title="Attach file"
          >
            +
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Gemini..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="text-yellow-400 text-lg leading-none hover:text-yellow-300 transition-colors disabled:opacity-30"
            title="Send"
          >
            ➤
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[9px] text-slate-600">Earn SOL for every prompt & reply</span>
          <span className="text-[9px] text-yellow-500/60 sreymara-mono">TALK-TO-EARN</span>
        </div>
      </div>
    </div>
  );
};

export default GeminiChatOverlay;
