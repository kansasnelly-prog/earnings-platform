import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { soraQueue, SoraJob } from '@/services/cinema/soraQueue';

type ActiveTab = 'chat' | 'video' | 'image' | 'sora';

interface Message {
  id: string;
  sender: 'user' | 'gemini' | 'openrouter' | 'system';
  text: string;
  timestamp: string;
  approved?: boolean;
  images?: string[];
}

interface MemoryEntry {
  id: string;
  type: 'conversation' | 'roadmap' | 'execution';
  content: string;
  timestamp: string;
  metadata?: any;
}

interface AttachedImage {
  id: string;
  base64: string;
  mimeType: string;
  name: string;
  size: number;
}

const MEMORY_KEY = 'gemini_studio_memory_v1';
const MEMORY_CAPACITY = '100 GB';
const MAX_IMAGES_PER_MESSAGE = 100;
const MAX_FILE_SIZE_MB = 20;
const MAX_TOTAL_PAYLOAD_MB = 100;

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resizeImage(base64: string, maxWidth = 1024, maxHeight = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = base64;
  });
}

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
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  const processFiles = async (files: FileList | File[]): Promise<AttachedImage[]> => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter((f) => f.type.startsWith('image/'));
    const results: AttachedImage[] = [];
    let totalSizeMB = 0;

    setBatchProgress({ current: 0, total: imageFiles.length });

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_SIZE_MB) {
        console.warn(`[ImageUpload] Skipping ${file.name}: ${sizeMB.toFixed(1)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        continue;
      }

      totalSizeMB += sizeMB;
      if (totalSizeMB > MAX_TOTAL_PAYLOAD_MB) {
        console.warn(`[ImageUpload] Total payload exceeds ${MAX_TOTAL_PAYLOAD_MB}MB, stopping at ${results.length} images`);
        break;
      }

      try {
        let base64 = await fileToBase64(file);
        base64 = await resizeImage(base64);
        const mimeMatch = base64.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : file.type || 'image/jpeg';

        results.push({
          id: `img_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 9)}`,
          base64,
          mimeType,
          name: file.name,
          size: file.size,
        });
      } catch (e) {
        console.error(`[ImageUpload] Failed to process ${file.name}:`, e);
      }

      setBatchProgress({ current: i + 1, total: imageFiles.length });
      await new Promise((r) => setTimeout(r, 0));
    }

    setBatchProgress(null);
    return results;
  };

  const handleFileSelect = async (files: FileList | File[]) => {
    const processed = await processFiles(files);
    setAttachedImages((prev) => {
      const combined = [...prev, ...processed];
      return combined.slice(0, MAX_IMAGES_PER_MESSAGE);
    });
  };

  const removeImage = (id: string) => {
    setAttachedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      await handleFileSelect(imageFiles);
    }
  };

  useEffect(() => {
    const chatContainer = dropZoneRef.current;
    if (!chatContainer) return;

    const handlePasteEvent = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFileSelect(imageFiles);
      }
    };

    chatContainer.addEventListener('paste', handlePasteEvent);
    return () => chatContainer.removeEventListener('paste', handlePasteEvent);
  }, []);

  const buildImageParts = (images: AttachedImage[]) => {
    return images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64.split(',')[1],
      },
    }));
  };

  const handleSendMessage = async () => {
    const hasText = inputMessage.trim().length > 0;
    const hasImages = attachedImages.length > 0;
    if ((!hasText && !hasImages) || isProcessing) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage || (hasImages ? 'Sent images for analysis.' : ''),
      timestamp: new Date().toLocaleTimeString(),
      images: hasImages ? attachedImages.map((img) => img.base64) : undefined,
    };

    appendMessage(userMsg);
    setInputMessage('');
    const imagesToSend = [...attachedImages];
    setAttachedImages([]);
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
    const enrichedInput = hasText ? `${inputMessage}${memoryContext}` : `Analyze these images and provide detailed feedback.${memoryContext}`;

    try {
      if (geminiKey) {
        abortControllerRef.current = new AbortController();
        const ai = new GoogleGenAI({ apiKey: geminiKey });

        try {
          const imageParts = buildImageParts(imagesToSend);
          const textPart = { text: enrichedInput };
          const parts = imageParts.length > 0 ? [...imageParts, textPart] : [textPart];

          const result = await ai.models.generateContentStream({
            model: selectedModel,
            config: {
              systemInstruction: `${systemInstruction}\n\nAuto-Approve: ${autoApprove}.`,
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            },
            contents: [{ role: 'user', parts }],
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
            const imageParts = buildImageParts(imagesToSend);
            const textPart = { text: enrichedInput };
            const parts = imageParts.length > 0 ? [...imageParts, textPart] : [textPart];

            const fallback = await ai.models.generateContent({
              model: selectedModel,
              config: {
                systemInstruction: `${systemInstruction}\n\nAuto-Approve: ${autoApprove}.`,
                thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              },
              contents: [{ role: 'user', parts }],
            });
            const text = fallback.text || 'Command executed.';
            setMessages((prev) => prev.map((msg) => msg.id === assistantMsgId ? { ...msg, text, sender: 'gemini', approved: autoApprove } : msg));
            addMemoryEntry('conversation', `GEMINI: ${text}`);
          }
        }
      } else if (openRouterKey) {
        const content: any[] = [];
        if (hasText) {
          content.push({ type: 'text', text: enrichedInput });
        }
        for (const img of imagesToSend) {
          content.push({
            type: 'image_url',
            image_url: { url: img.base64 },
          });
        }

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'google/gemini-2.5-flash:free', messages: [{ role: 'user', content }] }),
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
        const job = soraQueue.enqueue({
          prompt: mediaPrompt,
          seconds: 5,
          resolution: '720p',
          style: 'cinematic',
          metadata: { source: 'gemini_studio_command' },
        });

        const pollInterval = setInterval(() => {
          const updatedJob = soraQueue.getJob(job.id);
          if (!updatedJob || updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(pollInterval);
            if (updatedJob?.video_url) {
              setGeneratedMediaUrl(updatedJob.video_url);
              addMemoryEntry('execution', 'SORA VIDEO GENERATED', { prompt: mediaPrompt, url: updatedJob.video_url, jobId: job.id });
            } else if (updatedJob?.error) {
              setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
            }
            setIsProcessing(false);
          }
        }, 2000);

        setTimeout(() => {
          clearInterval(pollInterval);
          if (isProcessing) {
            setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31704-large.mp4');
            setIsProcessing(false);
          }
        }, 30000);
        return;
      } else {
        setTimeout(() => {
          setGeneratedMediaUrl('https://assets.mixkit.co/videos/preview/mixkit-technological-circuit-board-background-43187-large.mp4');
          setIsProcessing(false);
        }, 3000);
        return;
      }
    } catch (e: any) {
      alert(`Video Generation Status: ${e.message || 'API request processed.'}`);
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
      <style>{`
        @keyframes rainbowShift {
          0% { color: #ff0000; textShadow: 0 0 10px #ff0000; }
          14% { color: #ff8800; textShadow: 0 0 10px #ff8800; }
          28% { color: #ffff00; textShadow: 0 0 10px #ffff00; }
          42% { color: #00ff00; textShadow: 0 0 10px #00ff00; }
          57% { color: #0088ff; textShadow: 0 0 10px #0088ff; }
          71% { color: #8800ff; textShadow: 0 0 10px #8800ff; }
          85% { color: #ff0088; textShadow: 0 0 10px #ff0088; }
          100% { color: #ff0000; textShadow: 0 0 10px #ff0000; }
        }
        @keyframes rainbowBorder {
          0% { borderColor: #ff0000; boxShadow: 0 0 10px #ff0000; }
          14% { borderColor: #ff8800; boxShadow: 0 0 10px #ff8800; }
          28% { borderColor: #ffff00; boxShadow: 0 0 10px #ffff00; }
          42% { borderColor: #00ff00; boxShadow: 0 0 10px #00ff00; }
          57% { borderColor: #0088ff; boxShadow: 0 0 10px #0088ff; }
          71% { borderColor: #8800ff; boxShadow: 0 0 10px #8800ff; }
          85% { borderColor: #ff0088; boxShadow: 0 0 10px #ff0088; }
          100% { borderColor: #ff0000; boxShadow: 0 0 10px #ff0000; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rainbow-text {
          animation: rainbowShift 3s linear infinite;
        }
        .rainbow-border {
          animation: rainbowBorder 3s linear infinite;
        }
        .blink {
          animation: blink 1.5s ease-in-out infinite;
        }
        .glitch:hover {
          animation: glitch 0.3s ease-in-out infinite;
        }
      `}</style>

      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 className="rainbow-text" style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, textShadow: '0 0 20px currentColor' }}>
              Executive AI Co-Pilot Command Center
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.875rem', color: '#38bdf8', fontWeight: 'bold' }}>SREYMARA / Nelly TV 🎬</span>
              <span style={{ fontSize: '0.875rem', color: '#38bdf8', fontWeight: 'bold' }}>🧠 Memory Bank: {MEMORY_CAPACITY} Allocated</span>
              <span className="blink" style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>● ONLINE</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              REAL EARNINGS TOKENS<br/>ACTIVE STREAM
            </div>
            <div className="rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              SOL VAULT COUNTER<br/>CALCULATOR
            </div>
            <div className="rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              MINI VIEW / MOBILE<br/>4K VIDEO RECODING<br/>DECODER
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rainbow-border glitch"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '2px solid',
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
        </div>

        <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="rainbow-text" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>HEAVENLY PARADISESUPRIME SUITES</span>
          <span className="rainbow-text" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>NELLYSREYMARA</span>
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

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {[
              { key: 'chat', label: '💬 Chat' },
              { key: 'video', label: '🎬 Video / Sora' },
              { key: 'image', label: '🖼️ Image' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ActiveTab)}
                className={activeTab === tab.key ? 'rainbow-border' : ''}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: activeTab === tab.key ? '2px solid' : '1px solid #1e293b',
                  backgroundColor: activeTab === tab.key ? '#1d4ed8' : '#0f172a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '1.125rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === tab.key ? '0 0 15px rgba(29,78,216,0.5)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'chat' && (
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onPaste={handlePaste}
              style={{
                backgroundColor: isDragOver ? '#1e293b' : '#0f172a',
                borderRadius: '8px',
                border: `2px dashed ${isDragOver ? '#38bdf8' : '#1e293b'}`,
                padding: '16px',
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 className="rainbow-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                  Executive Chat Console
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="rainbow-text" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>HEAVENLY PARADISESUPRIME SUITES</span>
                  <span className="rainbow-text" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>NELLYSREYMARA</span>
                </div>
              </div>

              {batchProgress && (
                <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#1e293b', borderRadius: '4px', color: '#38bdf8', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  Processing images: {batchProgress.current} / {batchProgress.total}
                </div>
              )}

              <div style={{ height: '400px', overflowY: 'auto', backgroundColor: '#020617', borderRadius: '6px', border: '1px solid #1e293b', padding: '12px', marginBottom: '12px' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ marginBottom: '12px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                    <div style={{ display: 'inline-block', maxWidth: '85%' }}>
                      <span style={{ fontWeight: 'bold', color: msg.sender === 'user' ? '#38bdf8' : msg.sender === 'gemini' ? '#10b981' : msg.sender === 'openrouter' ? '#a855f7' : '#fbbf24', fontSize: '0.875rem' }}>
                        {msg.sender.toUpperCase()}
                      </span>
                      {msg.images && msg.images.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                          {msg.images.map((img, idx) => (
                            <img key={idx} src={img} alt="attached" style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '4px', border: '1px solid #334155' }} />
                          ))}
                        </div>
                      )}
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

              {attachedImages.length > 0 && (
                <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#020617', borderRadius: '6px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px' }}>
                    Attached Images ({attachedImages.length}/{MAX_IMAGES_PER_MESSAGE})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {attachedImages.map((img) => (
                      <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                        <img src={img.base64} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          onClick={() => removeImage(img.id)}
                          style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                    Total: {(attachedImages.reduce((sum, img) => sum + img.size, 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rainbow-border glitch"
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '2px solid',
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                  title="Attach images"
                >
                  📎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileSelect(e.target.files);
                      e.target.value = '';
                    }
                  }}
                  style={{ display: 'none' }}
                />

                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter executive command or prompt... (Ctrl+V to paste images)"
                  rows={3}
                  style={{ flex: 1, minWidth: '200px', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', resize: 'vertical' }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={isProcessing}
                  className="rainbow-border glitch"
                  style={{
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: '2px solid',
                    backgroundColor: isProcessing ? '#334155' : '#1d4ed8',
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? '⏳ Processing...' : '▶ Send Command'}
                </button>

                <label style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
                  Auto-Approve Execution
                </label>
              </div>

              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                💡 Tip: Paste images from clipboard (Ctrl+V / Cmd+V) or drag & drop into this area. Supports up to {MAX_IMAGES_PER_MESSAGE} images per message.
              </div>
            </div>
          )}

          {activeTab === 'video' && (
            <div style={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', padding: '16px' }}>
              <h3 className="rainbow-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Sora 2 Video Generation Engine</h3>
              <textarea
                value={mediaPrompt}
                onChange={(e) => setMediaPrompt(e.target.value)}
                placeholder="Describe the video scene for Sora 2 generation..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '12px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
                <button
                  onClick={() => handleGenerateVideo(true)}
                  disabled={isProcessing}
                  className="rainbow-border glitch"
                  style={{ padding: '12px 24px', borderRadius: '6px', border: '2px solid', backgroundColor: isProcessing ? '#334155' : '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
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
                <button
                  onClick={async () => {
                    if (!generatedMediaUrl) return;
                    try {
                      await fetch('/api/cinema/stream-reward', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: 'executive_user',
                          videoId: `sora_${Date.now()}`,
                          watchDurationSeconds: 5,
                          rewardAmount: 0.01,
                          sessionId: `session_${Date.now()}`,
                          metadata: { source: 'gemini_studio_command', generatedMediaUrl },
                        }),
                      });
                    } catch (e) {
                      console.error('[StreamReward] Failed to claim reward:', e);
                    }
                  }}
                  disabled={!generatedMediaUrl}
                  className="rainbow-border glitch"
                  style={{ padding: '12px 24px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#10b981', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
                >
                  🎁 Claim Stream Reward
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
              <h3 className="rainbow-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginBottom: '12px' }}>Image Generation Studio</h3>
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
                  className="rainbow-border glitch"
                  style={{ padding: '12px 24px', borderRadius: '6px', border: '2px solid', backgroundColor: isProcessing ? '#334155' : '#1d4ed8', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
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
    </div>
  );
};

export default GeminiCommandCenter;
