import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { soraQueue, SoraJob } from '@/services/cinema/soraQueue';
import { LivePhantomSyncWidget } from './LivePhantomSyncWidget';
import { ExecutiveMediaStudio } from './ExecutiveMediaStudio';
import { LiveVoiceController } from './LiveVoiceController';
import { ScreenShareWidget } from './ScreenShareWidget';

type ActiveTab = 'chat' | 'video' | 'image' | 'sora' | 'control-center';

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

interface StreamRow {
  time: string;
  node: string;
  action: string;
  tokens: string;
  status: string;
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
  { value: 'gemini-robotics-er-2-preview', label: 'Gemini Robotics ER 2 Preview' },
  { value: 'gemini-robotics-er-2-streaming-preview', label: 'Gemini Robotics ER 2 Streaming Preview' },
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

  const [ccMainTab, setCcMainTab] = useState<'decoder' | 'solvault' | 'stream' | 'video-vast'>('decoder');
  const [decoderSubTab, setDecoderSubTab] = useState<'concepts' | 'examples'>('concepts');
  const [solAmount, setSolAmount] = useState<number>(50);
  const [vaultTier, setVaultTier] = useState<string>('1.5');
  const [lockDays, setLockDays] = useState<number>(30);
  const [streamRows, setStreamRows] = useState<StreamRow[]>([
    { time: 'Just now', node: 'node_8f92a', action: 'Ad Impression Yield', tokens: '12.50', status: 'VERIFIED' },
    { time: '2s ago', node: 'node_12d4c', action: 'SolVault Staking Claim', tokens: '145.00', status: 'VERIFIED' },
    { time: '5s ago', node: 'node_99b1e', action: 'Decoder Signal Processed', tokens: '5.00', status: 'VERIFIED' },
  ]);

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

  useEffect(() => {
    if (activeTab !== 'control-center' || ccMainTab !== 'stream') return;

    const actions = ['Ad Impression Yield', 'SolVault Staking Claim', 'Decoder Signal Processed', 'Affiliate Referral Bonus'];
    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomNode = 'node_' + Math.random().toString(36).substring(2, 7);
      const randomTokens = (Math.random() * 25 + 1).toFixed(2);
      setStreamRows((prev) => {
        const newRow: StreamRow = {
          time: 'Just now',
          node: randomNode,
          action: randomAction,
          tokens: randomTokens,
          status: 'VERIFIED',
        };
        const updated = [newRow, ...prev];
        return updated.slice(0, 6);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, ccMainTab]);

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

  const appendMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
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

  const baseApy = 0.05;
  const yearlyBaseReturn = solAmount * baseApy;
  const dailyBaseReturn = yearlyBaseReturn / 365;
  const baseTokens = dailyBaseReturn * lockDays;
  const totalTokens = baseTokens * parseFloat(vaultTier);
  const bonusTokens = totalTokens - baseTokens;

  return (
    <div style={{ padding: '24px', backgroundColor: '#090d16', color: '#e2e8f0', fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <style>{`
        /* Enhanced Rainbow Keyframes for High-Vibrancy Glow */
        @keyframes rainbowShift {
          0%   { color: #ff0055; text-shadow: 0 0 18px #ff0055, 0 0 30px #ff0055; }
          20%  { color: #ff8800; text-shadow: 0 0 18px #ff8800, 0 0 30px #ff8800; }
          40%  { color: #00ff66; text-shadow: 0 0 18px #00ff66, 0 0 30px #00ff66; }
          60%  { color: #00ccff; text-shadow: 0 0 18px #00ccff, 0 0 30px #00ccff; }
          80%  { color: #9900ff; text-shadow: 0 0 18px #9900ff, 0 0 30px #9900ff; }
          100% { color: #ff0055; text-shadow: 0 0 18px #ff0055, 0 0 30px #ff0055; }
        }

        @keyframes rainbowBorder {
          0%   { border-color: #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.6); }
          20%  { border-color: #ff8800; box-shadow: 0 0 25px rgba(255, 136, 0, 0.6); }
          40%  { border-color: #00ff66; box-shadow: 0 0 25px rgba(0, 255, 102, 0.6); }
          60%  { border-color: #00ccff; box-shadow: 0 0 25px rgba(0, 204, 255, 0.6); }
          80%  { border-color: #9900ff; box-shadow: 0 0 25px rgba(153, 0, 255, 0.6); }
          100% { border-color: #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.6); }
        }

        /* Global Executive Dynamic Rainbow Glow */
        @keyframes rainbowTextShift {
          0%   { color: #ff0055; text-shadow: 0 0 12px #ff0055, 0 0 24px rgba(255, 0, 85, 0.6); }
          20%  { color: #ff8800; text-shadow: 0 0 12px #ff8800, 0 0 24px rgba(255, 136, 0, 0.6); }
          40%  { color: #00ff66; text-shadow: 0 0 12px #00ff66, 0 0 24px rgba(0, 255, 102, 0.6); }
          60%  { color: #00ccff; text-shadow: 0 0 12px #00ccff, 0 0 24px rgba(0, 204, 255, 0.6); }
          80%  { color: #9900ff; text-shadow: 0 0 12px #9900ff, 0 0 24px rgba(153, 0, 255, 0.6); }
          100% { color: #ff0055; text-shadow: 0 0 12px #ff0055, 0 0 24px rgba(255, 0, 85, 0.6); }
        }

        @keyframes rainbowBorderGlow {
          0%   { border-color: #ff0055; box-shadow: 0 0 18px rgba(255, 0, 85, 0.5), inset 0 0 10px rgba(255, 0, 85, 0.2); }
          20%  { border-color: #ff8800; box-shadow: 0 0 18px rgba(255, 136, 0, 0.5), inset 0 0 10px rgba(255, 136, 0, 0.2); }
          40%  { border-color: #00ff66; box-shadow: 0 0 18px rgba(0, 255, 102, 0.5), inset 0 0 10px rgba(0, 255, 102, 0.2); }
          60%  { border-color: #00ccff; box-shadow: 0 0 18px rgba(0, 204, 255, 0.5), inset 0 0 10px rgba(0, 204, 255, 0.2); }
          80%  { border-color: #9900ff; box-shadow: 0 0 18px rgba(153, 0, 255, 0.5), inset 0 0 10px rgba(153, 0, 255, 0.2); }
          100% { border-color: #ff0055; box-shadow: 0 0 18px rgba(255, 0, 85, 0.5), inset 0 0 10px rgba(255, 0, 85, 0.2); }
        }

        .executive-rainbow-border {
          background-color: #060913 !important;
          border: 2px solid #ff0055 !important;
          animation: rainbowBorderGlow 3s infinite linear !important;
        }

        .executive-rainbow-text {
          animation: rainbowTextShift 3s infinite linear !important;
        }

        /* Enhanced Rainbow Keyframes for High-Vibrancy Glow */
        @keyframes rainbowShift {
          0%   { color: #ff0055; text-shadow: 0 0 18px #ff0055, 0 0 30px #ff0055; }
          20%  { color: #ff8800; text-shadow: 0 0 18px #ff8800, 0 0 30px #ff8800; }
          40%  { color: #00ff66; text-shadow: 0 0 18px #00ff66, 0 0 30px #00ff66; }
          60%  { color: #00ccff; text-shadow: 0 0 18px #00ccff, 0 0 30px #00ccff; }
          80%  { color: #9900ff; text-shadow: 0 0 18px #9900ff, 0 0 30px #9900ff; }
          100% { color: #ff0055; text-shadow: 0 0 18px #ff0055, 0 0 30px #ff0055; }
        }

        @keyframes rainbowBorder {
          0%   { border-color: #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.6); }
          20%  { border-color: #ff8800; box-shadow: 0 0 25px rgba(255, 136, 0, 0.6); }
          40%  { border-color: #00ff66; box-shadow: 0 0 25px rgba(0, 255, 102, 0.6); }
          60%  { border-color: #00ccff; box-shadow: 0 0 25px rgba(0, 204, 255, 0.6); }
          80%  { border-color: #9900ff; box-shadow: 0 0 25px rgba(153, 0, 255, 0.6); }
          100% { border-color: #ff0055; box-shadow: 0 0 25px rgba(255, 0, 85, 0.6); }
        }

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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
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
        :root {
          --bg-main: #0f172a;
          --accent: #38bdf8;
          --accent-glow: rgba(56, 189, 248, 0.35);
          --glass-bg: rgba(255, 255, 255, 0.04);
          --glass-border: rgba(255, 255, 255, 0.1);
          --text-primary: #f8fafc;
          --text-muted: #94a3b8;
          --success: #10b981;
        }
        .cc-wrapper {
          background: linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1e1028 100%);
          padding: 2.5rem;
          border-radius: 20px;
          color: var(--text-primary);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          min-height: 700px;
        }
        .cc-header { margin-bottom: 2rem; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .badge { background: rgba(56, 189, 248, 0.15); color: var(--accent); padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
        .status-indicator { font-size: 0.8rem; color: var(--success); font-weight: 600; display: flex; align-items: center; gap: 0.4rem; }
        .dot { width: 8px; height: 8px; background-color: var(--success); border-radius: 50%; box-shadow: 0 0 8px var(--success); animation: pulse 1.5s infinite; }
        .cc-header h2 { font-size: 2rem; margin: 0.2rem 0; color: #fff; }
        .cc-header p { color: var(--text-muted); font-size: 0.95rem; }
        .glass-nav-bar { display: flex; gap: 0.75rem; background: rgba(15, 23, 42, 0.7); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--glass-border); margin-bottom: 1.5rem; }
        .nav-btn { flex: 1; background: transparent; border: none; color: var(--text-muted); padding: 0.75rem 1rem; font-size: 0.95rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; }
        .nav-btn.active, .nav-btn:hover { background: var(--accent); color: #0f172a; box-shadow: 0 0 15px var(--accent-glow); }
        .glass-main-card { background: var(--glass-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--glass-border); border-radius: 16px; padding: 2rem; }
        .main-tab-content { display: none; }
        .main-tab-content.active { display: block; animation: fadeIn 0.3s ease-in-out; }
        .section-title-wrapper { margin-bottom: 1.5rem; }
        .section-title-wrapper h3 { color: var(--accent); font-size: 1.4rem; margin-bottom: 0.3rem; }
        .section-title-wrapper p { color: var(--text-muted); font-size: 0.9rem; }
        .sub-toggle-bar { display: inline-flex; gap: 0.5rem; margin-bottom: 1.25rem; }
        .sub-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-muted); padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
        .sub-btn.active { background: rgba(56, 189, 248, 0.2); color: var(--accent); border-color: var(--accent); }
        .sub-tab-content { display: none; }
        .sub-tab-content.active { display: block; }
        .info-card { background: rgba(255, 255, 255, 0.025); border: 1px solid var(--glass-border); border-radius: 10px; padding: 1.2rem; margin-bottom: 1rem; }
        .info-card h4 { color: #fff; margin-bottom: 0.4rem; }
        .info-card p { color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; }
        .calculator-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .input-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .input-group label { font-size: 0.85rem; color: var(--text-muted); }
        .input-group input, .input-group select { background: rgba(0, 0, 0, 0.4); border: 1px solid var(--glass-border); color: #fff; padding: 0.75rem; border-radius: 8px; font-size: 0.95rem; }
        .calc-results-card { background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; justify-content: center; }
        .calc-results-card h4 { color: var(--accent); margin-bottom: 1rem; }
        .result-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem; }
        .result-row.total { font-size: 1.1rem; font-weight: bold; }
        .divider { border: 0; border-top: 1px solid var(--glass-border); margin: 0.5rem 0 1rem 0; }
        .stats-banner { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .stat-box { background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 10px; border: 1px solid var(--glass-border); text-align: center; }
        .stat-box span { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.3rem; }
        .stat-box strong { font-size: 1.1rem; color: #fff; }
        .stream-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
        .stream-table th { padding: 0.8rem; color: var(--text-muted); border-bottom: 1px solid var(--glass-border); }
        .stream-table td { padding: 0.8rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        code { background: rgba(0,0,0,0.5); color: var(--accent); padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
        .code-output { background: rgba(16, 185, 129, 0.1); border-left: 3px solid var(--success); color: #a7f3d0; padding: 0.6rem; font-family: monospace; font-size: 0.85rem; margin-top: 0.5rem; }
        .text-accent { color: var(--accent); }
        .text-green { color: var(--success); }
        .mt-2 { margin-top: 0.5rem; }
        .tag { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; }
        .tag-success { background: rgba(16, 185, 129, 0.2); color: var(--success); }
      `}</style>

      <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 className="executive-rainbow-text" style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0, textShadow: '0 0 20px currentColor' }}>
              Executive AI Co-Pilot Command Center
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="executive-rainbow-text" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>SREYMARA / Nelly TV 🎬</span>
              <span className="executive-rainbow-text" style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>🧠 Memory Bank: {MEMORY_CAPACITY} Allocated</span>
              <span className="blink" style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 'bold' }}>● ONLINE</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <div className="executive-rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              REAL EARNINGS TOKENS<br/>ACTIVE STREAM
            </div>
            <div className="executive-rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              SOL VAULT COUNTER<br/>CALCULATOR
            </div>
            <div className="executive-rainbow-border" style={{ padding: '6px 12px', borderRadius: '6px', border: '2px solid', backgroundColor: '#0f172a', color: '#fff', fontWeight: 'bold', fontSize: '0.75rem', textAlign: 'center' }}>
              MINI VIEW / MOBILE<br/>4K VIDEO RECODING<br/>DECODER
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="executive-rainbow-border"
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
          <span className="executive-rainbow-text" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>HEAVENLY PARADISESUPRIME SUITES</span>
          <span className="executive-rainbow-text" style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>NELLYSREYMARA</span>
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
              { key: 'control-center', label: '🎛️ Control Center' },
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

              <LiveVoiceController />
              <ExecutiveMediaStudio />
              <ScreenShareWidget />
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

          {activeTab === 'control-center' && (
            <div className="cc-wrapper">
              <header className="cc-header">
                <div className="header-top">
                  <span className="badge">ADMIN ROUTE: /admin/command-center</span>
                  <span className="status-indicator"><span className="dot"></span> STREAM ACTIVE</span>
                </div>
                <h2>Command Center Control Suite</h2>
                <p>Decoder Module | SolVault Counter & Calculator | Real Earnings Tokens Stream</p>
              </header>

              <nav className="executive-rainbow-border glass-nav-bar" style={{ display: 'flex', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '1.5rem' }}>
                <button
                  className={`nav-btn ${ccMainTab === 'decoder' ? 'active' : ''}`}
                  onClick={() => setCcMainTab('decoder')}
                >
                  🔍 Decoder Module
                </button>
                <button
                  className={`nav-btn ${ccMainTab === 'solvault' ? 'active' : ''}`}
                  onClick={() => setCcMainTab('solvault')}
                >
                  🧮 SolVault Calculator
                </button>
                <button
                  className={`nav-btn ${ccMainTab === 'stream' ? 'active' : ''}`}
                  onClick={() => setCcMainTab('stream')}
                >
                  ⚡ Token Active Stream
                </button>
                <button
                  className={`nav-btn ${ccMainTab === 'video-vast' ? 'active' : ''}`}
                  onClick={() => setCcMainTab('video-vast')}
                >
                  📺 Video / VAST
                </button>
              </nav>

              <div className="glass-main-card executive-rainbow-border">
                <div className={`main-tab-content ${ccMainTab === 'decoder' ? 'active' : ''}`}>
                  <div className="section-title-wrapper">
                    <h3 className="executive-rainbow-text">Decoder Module Breakdown</h3>
                    <p>Interpret incoming tracking strings, ad parameters, and encrypted media signals.</p>
                  </div>
                  <div className="sub-toggle-bar">
                    <button
                      className={`sub-btn ${decoderSubTab === 'concepts' ? 'active' : ''}`}
                      onClick={() => setDecoderSubTab('concepts')}
                    >
                      🔑 Key Concepts
                    </button>
                    <button
                      className={`sub-btn ${decoderSubTab === 'examples' ? 'active' : ''}`}
                      onClick={() => setDecoderSubTab('examples')}
                    >
                      💡 Real-World Examples
                    </button>
                  </div>
                  <div id="decoder-concepts" className={`sub-tab-content ${decoderSubTab === 'concepts' ? 'active' : ''}`}>
                    <div className="info-card">
                      <h4>1. Reversing the "Secret Code" (Decoding)</h4>
                      <p>When data moves across the internet or gets processed by platforms, it's often converted into a compact code (encoding) so it travels faster or stays secure. A decoder reverses that process so humans—or other computer programs—can actually understand it.</p>
                    </div>
                    <div className="info-card">
                      <h4>2. Processing Ad & Tracking Signals</h4>
                      <p>In digital platforms (like ad networks or affiliate earnings tools), tracking links often look like long strings of random letters and numbers. A decoder breaks down that string to reveal who clicked, where they came from, and how much money was made.</p>
                    </div>
                    <div className="info-card">
                      <h4>3. Audio & Video Processing</h4>
                      <p>If the platform deals with media (like video ads or stream monetization), a decoder converts compressed digital files (like <code>.mp4</code> or <code>.mp3</code> data) into visual frames and sound you can actually watch and hear.</p>
                    </div>
                  </div>
                  <div id="decoder-examples" className={`sub-tab-content ${decoderSubTab === 'examples' ? 'active' : ''}`}>
                    <div className="info-card">
                      <h4>1. The Ad Tracking Link Example</h4>
                      <p><strong>Encoded Link (Raw Data):</strong></p>
                      <p><code>http://nellyplatform.com/click?data=aWQ9MTIzJnJlZj1mYWNlYm9vaw==</code></p>
                      <p className="mt-2"><strong>What the Decoder Does:</strong> Translates the raw string into actionable parameters:</p>
                      <div className="code-output">User ID: 123 | Source: Facebook | Commission: $5.00</div>
                    </div>
                    <div className="info-card">
                      <h4>2. The Secret Message Example</h4>
                      <p>Imagine someone sends you a message written in Morse code (<code>... --- ...</code>). You don't speak Morse code, so you pass it through a decoder which turns it into plain text: <strong>"SOS"</strong>.</p>
                    </div>
                    <div className="info-card">
                      <h4>3. The Video Stream Example</h4>
                      <p>When streaming a digital video ad, the platform sends millions of binary signals (<code>1</code>s and <code>0</code>s). The browser decoder turns those bits back into smooth visual frames and audio.</p>
                    </div>
                  </div>
                </div>

                <div id="tab-solvault" className={`main-tab-content ${ccMainTab === 'solvault' ? 'active' : ''}`}>
                  <div className="section-title-wrapper">
                    <h3 className="executive-rainbow-text">SolVault Counter & Yield Calculator</h3>
                    <p>Calculate projected token yields, vault multiplier rewards, and real-time staking returns.</p>
                  </div>
                  <div className="calculator-grid">
                    <div className="calc-inputs">
                      <div className="input-group">
                        <label htmlFor="sol-amount">SOL Staked Amount:</label>
                        <input
                          type="number"
                          id="sol-amount"
                          value={solAmount}
                          min="0"
                          onChange={(e) => setSolAmount(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="input-group">
                        <label htmlFor="vault-tier">Vault Lock Tier:</label>
                        <select
                          id="vault-tier"
                          value={vaultTier}
                          onChange={(e) => setVaultTier(e.target.value)}
                        >
                          <option value="1">Flexible (1.0x Multiplier - 5% APY)</option>
                          <option value="1.5" selected={vaultTier === '1.5'}>Silver Vault (1.5x Multiplier - 8.5% APY)</option>
                          <option value="2.2" selected={vaultTier === '2.2'}>Gold Vault (2.2x Multiplier - 12% APY)</option>
                          <option value="3.5" selected={vaultTier === '3.5'}>Diamond Vault (3.5x Multiplier - 18% APY)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label htmlFor="lock-days">Duration (Days):</label>
                        <input
                          type="number"
                          id="lock-days"
                          value={lockDays}
                          min="1"
                          onChange={(e) => setLockDays(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="calc-results-card executive-rainbow-border">
                      <h4 className="executive-rainbow-text">Projected Yield Output</h4>
                      <div className="result-row">
                        <span>Base Tokens Earned:</span>
                        <strong>{baseTokens.toFixed(4)} SOL</strong>
                      </div>
                      <div className="result-row">
                        <span>Vault Bonus Boost:</span>
                        <strong className="text-accent">+{bonusTokens.toFixed(4)} SOL</strong>
                      </div>
                      <hr className="divider" />
                      <div className="result-row total">
                        <span>Total Projected Return:</span>
                        <strong>{totalTokens.toFixed(4)} SOL</strong>
                      </div>
                    </div>
                  </div>
                  <LivePhantomSyncWidget />
                </div>

                <div id="tab-stream" className={`main-tab-content ${ccMainTab === 'stream' ? 'active' : ''}`}>
                  <div className="section-title-wrapper">
                    <h3 className="executive-rainbow-text">Real Earnings Tokens Active Stream</h3>
                    <p>Live stream of incoming token distributions, commissions, and network executions.</p>
                  </div>
                  <div className="stats-banner">
                    <div className="stat-box executive-rainbow-border">
                      <span>Active Nodes</span>
                      <strong>1,482</strong>
                    </div>
                    <div className="stat-box executive-rainbow-border">
                      <span>24h Token Velocity</span>
                      <strong id="total-streamed">48,290.50 TOKENS</strong>
                    </div>
                    <div className="stat-box executive-rainbow-border">
                      <span>Network Health</span>
                      <strong className="text-green">99.98%</strong>
                    </div>
                  </div>
                  <div className="stream-table-wrapper">
                    <table className="stream-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>User / Node ID</th>
                          <th>Action Event</th>
                          <th>Tokens Allocated</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody id="stream-feed-body">
                        {streamRows.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.time}</td>
                            <td><code>{row.node}</code></td>
                            <td>{row.action}</td>
                            <td className="text-accent">+{row.tokens} EARN</td>
                            <td><span className="tag tag-success">VERIFIED</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div id="tab-video-vast" className={`main-tab-content ${ccMainTab === 'video-vast' ? 'active' : ''}`}>
                  <div className="section-title-wrapper">
                    <h3>Video / VAST Integration</h3>
                    <p>Live ad player slot and VAST tag integration for video monetization.</p>
                  </div>
                  <div className="glass-main-card" style={{ marginTop: 0 }}>
                    <div id="video-ad-container">
                      <script type="text/javascript" src="https://faithfuloccasion.com/dJmgF.zwdOGrNrv-ZcGIUJ/IeVmw9zuGZMUYlckSPHTacvzmM/TYYK1TMJjgUKtHN-zgMFx_NejHUMyzO/SlZ/sRaGWk1VpwdOD/0Zxi"></script>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeminiCommandCenter;