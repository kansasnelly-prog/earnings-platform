import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import {
  MessageCircle, Send, RefreshCw, CheckCircle, User,
  Clock, ChevronLeft, Search, Trash2, Unlock, Lock,
  AlertCircle, CheckCheck, X, Paperclip, FileText, Image as ImageIcon,
  Bot, Copy, Sparkles, Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Conversation {
  id: string;
  user_id: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: string;
  issue_label?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
}

interface UserData {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  account_type: 'training' | 'personal' | 'admin';
  vip_level: number;
  balance: number;
  total_earned: number;
  tasks_completed: number;
  total_tasks: number;
  created_at: string;
  user_status?: string;
  personal_cycle?: number;
  personal_cycle_completed?: boolean;
}

const AdminCustomerService: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed' | 'pending'>('all');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'retrying'>('connected');
  const isFetchingRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const subscriptionsRef = useRef<any[]>([]);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  
  // New states for AI features
  const [selectedUserData, setSelectedUserData] = useState<UserData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{type: string, content: string}>>([]);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  
  // Attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Exponential backoff retry with jitter
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleNetworkError = async () => {
    if (retryCountRef.current >= maxRetries) {
      setConnectionStatus('disconnected');
      toast.error('Connection lost. Please refresh the page.', {
        duration: 10000,
        id: 'connection-lost'
      });
      return;
    }

    retryCountRef.current++;
    setConnectionStatus('retrying');
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current) + Math.random() * 500, 30000);
    
    console.log(`[AdminCustomerService] Network error. Retrying in ${Math.round(delay)}ms (attempt ${retryCountRef.current}/${maxRetries})`);
    
    if (retryCountRef.current === 1) {
      toast.loading('Connection lost. Retrying...', { id: 'connection-retry' });
    }

    await sleep(delay);
    
    // Retry the fetch
    try {
      await fetchConversations();
      setConnectionStatus('connected');
      retryCountRef.current = 0;
      toast.success('Connection restored', { id: 'connection-retry' });
    } catch (err) {
      console.error('[AdminCustomerService] Retry failed:', err);
      handleNetworkError();
    }
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // File handling functions
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload JPG, PNG, WEBP, or PDF files only.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Maximum file size is 10MB.');
      return;
    }

    setSelectedFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const clearAttachment = () => {
    setSelectedFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // AI Suggestion Logic
  const generateAISuggestions = (message: string): Array<{type: string, content: string}> => {
    const lowerMessage = message.toLowerCase();
    
    // Base response based on issue type
    let baseResponse = "";
    let issueType = "general";
    
    if (lowerMessage.includes('reset') || lowerMessage.includes('restart') || lowerMessage.includes('start over')) {
      baseResponse = "Hello, your reset request has been received. Please confirm your registered email for verification. Once verified, we will proceed with resetting your account.";
      issueType = "reset";
    } else if (lowerMessage.includes('withdrawal') || lowerMessage.includes('withdraw') || lowerMessage.includes('cash out')) {
      baseResponse = "Your withdrawal is currently under review. Processing time depends on account level and verification status. Please ensure your wallet address is correct and your account is fully verified.";
      issueType = "withdrawal";
    } else if (lowerMessage.includes('login') || lowerMessage.includes('sign in') || lowerMessage.includes('access') || lowerMessage.includes('password')) {
      baseResponse = "I understand you're having trouble accessing your account. Please try clearing your browser cache or using a different browser. If the issue persists, please provide your registered email so we can assist further.";
      issueType = "login";
    } else if (lowerMessage.includes('wallet') || lowerMessage.includes('bind') || lowerMessage.includes('wallet address')) {
      baseResponse = "For wallet binding, please ensure you're using a supported wallet type (USDT-TRC20, USDT-ERC20, USDT-BEP20, or BTC). Double-check your wallet address before submitting. If you've already submitted, our team is reviewing it.";
      issueType = "wallet";
    } else if (lowerMessage.includes('deposit') || lowerMessage.includes('add funds') || lowerMessage.includes('top up')) {
      baseResponse = "For deposit assistance, please check your transaction hash on the blockchain. If your deposit is not showing after 30 minutes, please provide the transaction hash and timestamp for investigation.";
      issueType = "deposit";
    } else if (lowerMessage.includes('upgrade') || lowerMessage.includes('vip') || lowerMessage.includes('level')) {
      baseResponse = "VIP upgrades are available based on your account balance and task completion. Please check your current balance and completed tasks. Contact us if you need assistance with the upgrade process.";
      issueType = "upgrade";
    } else if (lowerMessage.includes('task') || lowerMessage.includes('commission') || lowerMessage.includes('earnings')) {
      baseResponse = "Regarding tasks and earnings, please ensure you've completed all required tasks correctly. If you believe there's an error in your earnings calculation, please provide specific details about which task is affected.";
      issueType = "task";
    } else {
      baseResponse = "Thank you for your message. Our support team is reviewing your inquiry. For faster resolution, please include your account email and any relevant details about your issue.";
      issueType = "general";
    }
    
    // Generate 5 distinct variations
    return [
      {
        type: "Professional",
        content: baseResponse
      },
      {
        type: "Empathetic",
        content: `I understand this might be frustrating, and I'm here to help. ${baseResponse.toLowerCase()}`
      },
      {
        type: "Short",
        content: baseResponse.split('.')[0] + "."
      },
      {
        type: "Detailed",
        content: `${baseResponse} Our team typically responds within 24-48 hours. If this is urgent, please mark it as high priority. We appreciate your patience while we work to resolve your ${issueType} issue.`
      },
      {
        type: "Technical",
        content: `${baseResponse} Please also provide any error messages or screenshots if applicable. This will help our technical team diagnose the issue more efficiently.`
      }
    ];
  };

  // Auto-labeling logic
  const detectIssueLabel = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('reset') || lowerMessage.includes('restart')) return 'Reset Request';
    if (lowerMessage.includes('withdrawal') || lowerMessage.includes('withdraw')) return 'Withdrawal Issue';
    if (lowerMessage.includes('login') || lowerMessage.includes('sign in') || lowerMessage.includes('password')) return 'Login Problem';
    if (lowerMessage.includes('wallet') || lowerMessage.includes('bind')) return 'Wallet Binding';
    if (lowerMessage.includes('deposit') || lowerMessage.includes('add funds')) return 'Deposit Issue';
    if (lowerMessage.includes('upgrade') || lowerMessage.includes('vip')) return 'Upgrade Inquiry';
    
    return 'General Inquiry';
  };

  // Fetch user data when conversation is selected
  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AdminCustomerService] Error fetching user data:', error);
        return;
      }

      setSelectedUserData(data as UserData);
    } catch (err) {
      console.error('[AdminCustomerService] Exception fetching user data:', err);
    }
  };

  // Generate AI suggestion when customer sends a message
  const handleGenerateSuggestion = async () => {
    if (!messages.length) return;

    // Get last customer message
    const lastCustomerMessage = [...messages].reverse().find(msg => msg.user_id !== 'admin');
    if (!lastCustomerMessage) return;

    setIsGeneratingSuggestion(true);

    try {
      // Call the new AI-powered API
      const response = await fetch('/api/generate-ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: lastCustomerMessage.content,
          conversationHistory: messages
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[AdminCustomerService] AI suggestion API error:', text);
        // Fallback to rule-based suggestions if API fails
        const fallbackSuggestions = generateAISuggestions(lastCustomerMessage.content);
        setAiSuggestions(fallbackSuggestions);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[AdminCustomerService] AI suggestion API returned non-JSON:', text);
        // Fallback to rule-based suggestions if API returns non-JSON
        const fallbackSuggestions = generateAISuggestions(lastCustomerMessage.content);
        setAiSuggestions(fallbackSuggestions);
        return;
      }

      const data = await response.json();

      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
      } else {
        console.error('[AdminCustomerService] AI suggestion error:', data.error);
        // Fallback to rule-based suggestions if AI fails
        const fallbackSuggestions = generateAISuggestions(lastCustomerMessage.content);
        setAiSuggestions(fallbackSuggestions);
      }
    } catch (error) {
      console.error('[AdminCustomerService] AI suggestion exception:', error);
      // Fallback to rule-based suggestions if API call fails
      const fallbackSuggestions = generateAISuggestions(lastCustomerMessage.content);
      setAiSuggestions(fallbackSuggestions);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const copySuggestion = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Suggestion copied to clipboard');
  };

  const useSuggestion = (content: string) => () => {
    setNewMessage(content);
    setAiSuggestions([]);
  };

  const uploadAttachment = async (file: File): Promise<{url: string, type: string, name: string, size: number} | null> => {
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `admin/${timestamp}-${randomString}-${sanitizedName}`;

      const { error: uploadError } = await supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[AdminCustomerService] Upload error:', uploadError);
        toast.error('Upload failed: ' + uploadError.message);
        return null;
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        type: file.type,
        name: file.name,
        size: file.size
      };
    } catch (error) {
      console.error('[AdminCustomerService] Upload exception:', error);
      toast.error('Failed to upload attachment. Please try again.');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const sendReply = async () => {
    const messageText = newMessage.trim();
    
    // Allow sending if there's text OR an attachment
    if ((!messageText && !selectedFile) || !selectedConversation || isSending || isUploading) return;

    console.log('[AdminCustomerService] Sending reply to conversation:', selectedConversation.id);
    setIsSending(true);

    let attachmentData: {url: string, type: string, name: string, size: number} | null = null;
    
    // Upload attachment if present
    if (selectedFile) {
      try {
        attachmentData = await uploadAttachment(selectedFile);
        if (!attachmentData) {
          setIsSending(false);
          return;
        }
      } catch (uploadError) {
        console.error('[AdminCustomerService] Attachment upload failed:', uploadError);
        toast.error('Attachment upload failed. Please try again.');
        setIsSending(false);
        return;
      }
    }

    try {
      // Build message insert data
      const messageData: any = {
        conversation_id: selectedConversation.id,
        sender: 'admin',
        message: messageText || null
      };
      
      // Add attachment data if present
      if (attachmentData) {
        messageData.attachment_url = attachmentData.url;
        messageData.attachment_type = attachmentData.type;
        messageData.attachment_name = attachmentData.name;
        messageData.attachment_size = attachmentData.size;
      }

      // Insert admin message into Supabase with timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Admin reply submission timeout after 15 seconds'));
        }, 15000);
      });

      const insertPromise = (async () => {
        const { data: savedMessage, error } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single();

        if (error) {
          console.error('[AdminCustomerService] Error sending reply:', error);
          throw error;
        }

        console.log('[AdminCustomerService] Reply saved:', savedMessage?.id);

        // Clear attachment after successful send
        if (attachmentData) {
          clearAttachment();
        }

        // Track message ID
        if (savedMessage?.id) {
          processedMessageIds.current.add(savedMessage.id);
        }

        // Optimistically add to UI
        const newMsg: Message = {
          id: savedMessage?.id || crypto.randomUUID(),
          conversation_id: selectedConversation.id,
          user_id: 'admin',
          content: messageText,
          created_at: savedMessage?.created_at || new Date().toISOString(),
          attachment_url: savedMessage?.attachment_url,
          attachment_type: savedMessage?.attachment_type,
          attachment_name: savedMessage?.attachment_name,
          attachment_size: savedMessage?.attachment_size
        };
        setMessages(prev => [...prev, newMsg]);

        return savedMessage;
      })();

      await Promise.race([insertPromise, timeoutPromise]);

      // Update conversation updated_at and ensure status is open
      try {
        await supabase
          .from('conversations')
          .update({ 
            updated_at: new Date().toISOString(),
            status: selectedConversation.status === 'closed' ? 'open' : selectedConversation.status
          })
          .eq('id', selectedConversation.id);
        console.log('[AdminCustomerService] Conversation updated successfully');
      } catch (error) {
        console.error('[AdminCustomerService] Error updating conversation:', error);
        toast.error('Failed to update conversation status');
      }

      // Update conversation in state
      setSelectedConversation(prev => prev ? {
        ...prev,
        updated_at: new Date().toISOString(),
        status: prev.status === 'closed' ? 'open' : prev.status
      } : null);

      setNewMessage('');
      toast.success(attachmentData ? 'Reply with attachment sent successfully' : 'Reply sent successfully');
    } catch (err) {
      console.error('[AdminCustomerService] Error in sendReply:', err);
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch conversations on mount
  useEffect(() => {
    let isMounted = true;

    const loadConversations = async () => {
      if (!isMounted) return;
      try {
        await fetchConversations();
        setConnectionStatus('connected');
        retryCountRef.current = 0;
      } catch (err) {
        console.error('Failed to load conversations:', err);
        if (isMounted) setError('Failed to load conversations');
      }
    };

    loadConversations();

    // Poll for new conversations every 15 seconds (reduced from 5s to avoid excessive polling)
    const interval = setInterval(() => {
      if (isMounted) {
        try {
          fetchConversations();
          setConnectionStatus('connected');
          retryCountRef.current = 0;
        } catch (err) {
          console.error('[AdminCustomerService] Polling error:', err);
          handleNetworkError();
        }
      }
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Reset unread count when conversation is selected
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const resetUnreadCount = async () => {
      try {
        await supabase
          .from('conversations')
          .update({ unread_count: 0 })
          .eq('id', selectedConversation.id);
      } catch (err) {
        console.error('[AdminCustomerService] Error resetting unread count:', err);
      }
    };

    resetUnreadCount();
  }, [selectedConversation?.id]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;

    let isMounted = true;

    const loadAdminMessages = async () => {
      if (!isMounted) return;
      try {
        await fetchMessages(selectedConversation.id);
        // Fetch user data
        await fetchUserData(selectedConversation.user_id);
        setConnectionStatus('connected');
        retryCountRef.current = 0;
      } catch (err) {
        console.error('[AdminCustomerService] Failed to load messages:', err);
        handleNetworkError();
      }
    };

    loadAdminMessages();

    // Poll for new messages every 10 seconds (minimum to avoid aggressive polling)
    pollIntervalRef.current = setInterval(() => {
      if (isMounted && selectedConversation?.id) {
        try {
          fetchMessages(selectedConversation.id, true);
          setConnectionStatus('connected');
          retryCountRef.current = 0;
        } catch (err) {
          console.error('[AdminCustomerService] Message polling error:', err);
          handleNetworkError();
        }
      }
    }, 10000);  

    return () => {
      isMounted = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      // Clear user data when conversation changes
      setSelectedUserData(null);
      setAiSuggestions([]);
    };
  }, [selectedConversation?.id]);

  // Real-time subscription for new messages and conversation updates
  useEffect(() => {
    if (!selectedConversation?.id) return;

    console.log('[AdminCustomerService] Setting up realtime for conversation:', selectedConversation.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`admin-messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          console.log('[AdminCustomerService] Realtime message received:', payload);
          const newMessage = payload.new as any;
          
          // Prevent duplicates
          if (processedMessageIds.current.has(newMessage.id)) {
            console.log('[AdminCustomerService] Duplicate message ignored:', newMessage.id);
            return;
          }
          processedMessageIds.current.add(newMessage.id);
          
          const transformedMsg = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            user_id: newMessage.sender === 'user' ? 'user' : 'admin',
            content: newMessage.message,
            created_at: newMessage.created_at,
            attachment_url: newMessage.attachment_url,
            attachment_type: newMessage.attachment_type,
            attachment_name: newMessage.attachment_name,
            attachment_size: newMessage.attachment_size,
          };
          
          setMessages((prev) => {
            const exists = prev.some(m => m.id === transformedMsg.id);
            if (exists) return prev;
            return [...prev, transformedMsg];
          });
          
          // Show notification for user messages
          if (newMessage.sender === 'user') {
            toast.info('New message from customer');
            fetchConversations();
            // Auto-generate AI suggestion for new customer message
            const suggestions = generateAISuggestions(newMessage.message || '');
            setAiSuggestions(suggestions);
            // Auto-detect and save issue label
            const label = detectIssueLabel(newMessage.message || '');
            if (label && label !== 'General Inquiry') {
              supabase
                .from('conversations')
                .update({ issue_label: label })
                .eq('id', selectedConversation.id)
                .then(({ error }) => {
                  if (error) console.error('[AdminCustomerService] Error updating issue label:', error);
                });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[AdminCustomerService] Messages subscription status:', status);
      });

    // Subscribe to conversation status changes
    const conversationChannel = supabase
      .channel(`admin-conversation-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          console.log('[AdminCustomerService] Conversation status update:', payload);
          const updated = payload.new as any;
          
          setSelectedConversation(prev => prev ? { 
            ...prev, 
            status: updated.status,
            updated_at: updated.updated_at 
          } : null);
          
          fetchConversations();
        }
      )
      .subscribe((status) => {
        console.log('[AdminCustomerService] Conversation subscription status:', status);
      });

    subscriptionsRef.current = [messagesChannel, conversationChannel];

    return () => {
      console.log('[AdminCustomerService] Removing realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
      subscriptionsRef.current = [];
    };
  }, [selectedConversation?.id]);

  // Real-time subscription for ALL new messages (to update conversation list)
  useEffect(() => {
    const messagesChannel = supabase
      .channel('admin-all-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔥 New message received (all):', payload);
          // Refresh conversations to show updated last message
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  // Real-time subscription for new conversations
  useEffect(() => {
    const conversationsChannel = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('🔥 New conversation received:', payload);
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  const fetchConversations = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[AdminCustomerService] Error fetching conversations:', error);
        setError('Failed to fetch conversations: ' + error.message);
        setConversations([]);
        return;
      }

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: messages, error: msgError } = await supabase
            .from('messages')
            .select('message, created_at, sender')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (msgError) {
            console.error('[AdminCustomerService] Error fetching last message:', msgError);
          }

          return {
            ...conv,
            last_message: messages?.[0]?.message || '',
            unread_count: conv.unread_count || 0
          };
        })
      );

      setConversations(conversationsWithLastMessage);
      setError(null);
    } catch (err: any) {
      console.error('[AdminCustomerService] Error in fetchConversations:', err);
      setError('Failed to fetch conversations: ' + (err?.message || 'Unknown error'));
      setConversations([]);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const fetchMessages = async (conversationId: string, isPolling = false) => {
    if (!conversationId) return;

    if (isPolling && isFetchingRef.current) {
      console.log('[AdminCustomerService] Skipping polling: already fetching');
      return;
    }

    isFetchingRef.current = true;

    if (!isPolling) {
      setIsLoading(true);
    }

    console.log('[AdminCustomerService] Fetching messages for conversation:', conversationId);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[AdminCustomerService] Supabase error:', error);
        setError('Failed to load messages');
        setMessages([]);
        return;
      }

      console.log('[AdminCustomerService] Fetched', data?.length || 0, 'messages');

      // Track all message IDs to prevent duplicates
      data?.forEach(msg => processedMessageIds.current.add(msg.id));

      // Transform messages to match the expected format
      const transformedMessages = (data || []).map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        user_id: msg.sender === 'user' ? 'user' : 'admin',
        content: msg.message,
        created_at: msg.created_at,
        attachment_url: msg.attachment_url,
        attachment_type: msg.attachment_type,
        attachment_name: msg.attachment_name,
        attachment_size: msg.attachment_size
      }));

      setMessages(transformedMessages);

    } catch (err) {
      console.error('[AdminCustomerService] Error in fetchMessages:', err);
    } finally {
      isFetchingRef.current = false;
      setIsSending(false);
      return;
    }
  }

  // Update conversation status
  const updateConversationStatus = async (convId: string, newStatus: 'open' | 'pending' | 'closed') => {
    console.log('[AdminCustomerService] Updating conversation status:', convId, '->', newStatus);
    setIsUpdatingStatus(true);
    
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', convId);

      if (error) {
        console.error('[AdminCustomerService] Error updating conversation status:', error);
        toast.error('Failed to update conversation status');
        return;
      }

      console.log('[AdminCustomerService] Conversation status updated to:', newStatus);
      toast.success(`Conversation marked as ${newStatus}`);
      fetchConversations();
      
      // Update selected conversation if it's the current one
      if (selectedConversation?.id === convId) {
        setSelectedConversation(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('[AdminCustomerService] Error updating status:', err);
      toast.error('Failed to update conversation status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Legacy close function (now uses updateConversationStatus)
  const closeConversation = async (convId: string) => {
    await updateConversationStatus(convId, 'closed');
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
      setMessages([]);
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      if (error) {
        console.error('Error deleting conversation:', error);
        toast.error('Failed to delete conversation');
        return;
      }

      toast.success('Conversation deleted');
      fetchConversations();
      if (selectedConversation?.id === convId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Unlock className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Safely filter conversations
  const filteredConversations = React.useMemo(() => {
    if (!Array.isArray(conversations)) return [];

    return conversations.filter(conv => {
      if (!conv || typeof conv !== 'object') return false;
      const userId = conv.user_id || '';
      const id = conv.id || '';
      const search = searchTerm || '';
      const matchesSearch = userId.toLowerCase().includes(search.toLowerCase()) ||
                           id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchTerm, statusFilter]);

  // Count open conversations safely
  const openConversationsCount = React.useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.filter(c => c && c.status === 'open').length;
  }, [conversations]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      <Toaster position="top-right" />

      <div className="flex h-screen flex-row overflow-hidden">
        {/* Sidebar - Conversation List - Fixed width 350px */}
        <div className="w-[350px] shrink-0 bg-slate-900/50 border-r border-white/10 flex-col hidden md:flex">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-slate-900">Customer Support</h2>
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
                    connectionStatus === 'retrying' ? 'bg-amber-500 animate-pulse' :
                    'bg-red-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    connectionStatus === 'connected' ? 'text-green-600' :
                    connectionStatus === 'retrying' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {connectionStatus === 'connected' ? 'Connected' :
                     connectionStatus === 'retrying' ? 'Retrying...' :
                     'Disconnected'}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-sm">
                {conversations.length} total • {conversations.filter(c => c.status === 'open').length} open • {conversations.filter(c => c.status === 'pending').length} pending
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'open', 'pending', 'closed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No conversations found</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 text-left border-b border-white/5 transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-pink-500/20 border-l-4 border-l-pink-500'
                    : 'hover:bg-white/5 border-l-4 border-l-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{conv.user_id?.slice(0, 8) || 'Unknown'}</p>
                      <p className="text-slate-400 text-xs">{conv.id?.slice(0, 8) || 'N/A'}</p>
                    </div>
                  </div>
                  {conv.unread_count ? (
                    <span className="px-2 py-1 bg-pink-500 text-white text-xs rounded-full font-bold">
                      {conv.unread_count}
                    </span>
                  ) : null}
                </div>
                <p className="text-slate-400 text-sm mt-2 truncate">
                  {conv.last_message || 'No messages yet'}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {conv.issue_label && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Tag className="w-3 h-3" />
                      {conv.issue_label}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    conv.status === 'open' ? 'bg-green-500/20 text-green-400' :
                    conv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {conv.status || 'unknown'}
                  </span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {conv.updated_at ? formatTime(conv.updated_at) : 'N/A'}
                  </span>
                </div>
              </button>
            )))}
          </div>
        </div>

        {/* Main Chat Area - Always visible, fills remaining width */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-900/30">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-2 md:p-4 border-b border-white/10">
                {/* User Identity Header */}
                {selectedUserData && (
                  <div className="mb-3 p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-bold text-white">{selectedUserData.display_name || selectedUserData.username || 'User'}</span>
                      <span className="text-slate-400">|</span>
                      <a href={`mailto:${selectedUserData.email}`} className="text-indigo-400 hover:underline">{selectedUserData.email}</a>
                      <span className="text-slate-400">|</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                        {selectedUserData.account_type.toUpperCase()}
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-emerald-400 font-medium">Balance ${selectedUserData.balance.toFixed(2)}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-amber-400">
                        VIP{selectedUserData.vip_level} • {selectedUserData.tasks_completed}/{selectedUserData.total_tasks} tasks
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500 text-xs">
                        Joined {new Date(selectedUserData.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 hover:bg-white/10 rounded-lg md:hidden"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-sm md:text-base truncate">{selectedConversation.user_id?.slice(0, 8) || 'Unknown User'}</h3>
                      <p className="text-slate-400 text-xs md:text-sm hidden sm:block">
                        Customer Service
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusBadgeClass(selectedConversation.status)} hidden sm:flex`}>
                      {getStatusIcon(selectedConversation.status)}
                      <span className="capitalize">{selectedConversation.status}</span>
                    </div>

                    <button
                      onClick={() => fetchMessages(selectedConversation.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                      title="Refresh"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => updateConversationStatus(selectedConversation.id, e.target.value as any)}
                        disabled={isUpdatingStatus}
                        className="px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                        title="Change status"
                      >
                        <option value="open">Open</option>
                        <option value="pending">Pending</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <button
                      onClick={() => deleteConversation(selectedConversation.id)}
                      className="flex items-center gap-1 px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex-shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs font-medium hidden lg:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 bg-slate-800/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isAdmin = msg.user_id === 'admin';
                    const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.user_id !== msg.user_id;
                    
                    return (
                      <div 
                        key={msg.id || index} 
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[85%] md:max-w-[75%] ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
                          <div className={`p-3 rounded-2xl ${
                            isAdmin 
                              ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-md' 
                              : 'bg-slate-700 border border-slate-600 text-slate-100 rounded-bl-md'
                          }`}>
                            {/* Attachment display */}
                            {msg.attachment_url && (
                              <div className="mb-2">
                                {msg.attachment_type?.startsWith('image/') ? (
                                  <a 
                                    href={msg.attachment_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block rounded-lg overflow-hidden border border-white/20 hover:border-white/40 transition-colors"
                                  >
                                    <img 
                                      src={msg.attachment_url} 
                                      alt={msg.attachment_name || 'Attachment'}
                                      className="max-w-full max-h-48 object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    href={msg.attachment_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all"
                                  >
                                    <FileText className="w-5 h-5 text-blue-400" />
                                    <div className="text-left">
                                      <p className="text-white text-sm font-medium truncate max-w-[200px]">
                                        {msg.attachment_name || 'Document'}
                                      </p>
                                      <p className="text-white/50 text-xs">
                                        {msg.attachment_size ? formatFileSize(msg.attachment_size) : 'File'}
                                      </p>
                                    </div>
                                  </a>
                                )}
                              </div>
                            )}
                            <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content || (msg.attachment_url ? '' : "No content")}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-slate-500 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                            <span>{isAdmin ? 'You' : 'Customer'}</span>
                            <span>•</span>
                            <span>{formatTime(msg.created_at)}</span>
                            {isAdmin && <CheckCheck className="w-3 h-3 text-pink-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-2 md:p-4 border-t border-white/10">
                {selectedConversation.status === 'closed' ? (
                  <div className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <Lock className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">This conversation is closed. Change status to reply.</span>
                  </div>
                ) : (
                  <>
                    {/* AI Assistant Panel */}
                    {aiSuggestions.length > 0 && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                        <div className="flex items-start gap-2 mb-3">
                          <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-purple-300 font-medium text-sm">AI Suggestions</span>
                              <Sparkles className="w-3 h-3 text-purple-400" />
                            </div>
                            <p className="text-slate-400 text-xs">Click any suggestion to use it</p>
                          </div>
                          <button
                            onClick={() => setAiSuggestions([])}
                            className="flex items-center gap-1 px-2 py-1 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/30 rounded-lg text-xs text-slate-300 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {aiSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => useSuggestion(suggestion.content)}
                              className="w-full text-left p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-purple-300">{suggestion.type}</span>
                                  </div>
                                  <p className="text-slate-300 text-xs line-clamp-2">{suggestion.content}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copySuggestion(suggestion.content);
                                  }}
                                  className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generate AI Suggestion Button */}
                    {aiSuggestions.length === 0 && messages.length > 0 && (
                      <button
                        onClick={handleGenerateSuggestion}
                        disabled={isGeneratingSuggestion}
                        className="mb-3 w-full flex items-center justify-center gap-2 p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/20 transition-all text-sm disabled:opacity-50"
                      >
                        {isGeneratingSuggestion ? (
                          <>
                            <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate AI Suggestion
                          </>
                        )}
                      </button>
                    )}

                    {/* Attachment Preview */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-white/10 rounded-xl border border-white/20">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {attachmentPreview ? (
                              <img 
                                src={attachmentPreview} 
                                alt="Preview" 
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <FileText className="w-12 h-12 text-blue-400" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-white/60 text-xs">
                                {formatFileSize(selectedFile.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={clearAttachment}
                            disabled={isUploading}
                            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {isUploading && (
                          <div className="mt-2 flex items-center gap-2 text-white/60 text-xs">
                            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                            Uploading file...
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 md:gap-3">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      {/* Attachment Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || isUploading}
                        className="px-3 py-2 md:px-4 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 hover:border-white/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Attach file (JPG, PNG, WEBP, PDF - Max 10MB)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                      
                      {/* Message Input */}
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && !isSending && sendReply()
                        }
                        placeholder="Type your reply..."
                        disabled={isSending || isUploading}
                        className="flex-1 px-3 py-2 md:px-4 md:py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 transition-all"
                      />
                      
                      {/* Send Button */}
                      <button
                        onClick={sendReply}
                        disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                        className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSending ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span className="hidden sm:inline">Send</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
              <MessageCircle className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation to start messaging</p>
              <p className="text-sm mt-2 opacity-60">Choose from the conversation list on the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerService;
