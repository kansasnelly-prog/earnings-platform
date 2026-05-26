import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { useCSNotification } from '@/contexts/CSNotificationContext';
import { X, Send, MessageCircle, ExternalLink, RefreshCw, Lock, Unlock, Clock, Paperclip, X as XIcon, FileText, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  is_admin: boolean;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
}

interface Conversation {
  id: string;
  user_id: string;
  user_email?: string;
  username: string;
  telegram_chat_id?: string;
  status: 'open' | 'closed' | 'pending';
  created_at: string;
  updated_at: string;
}

const CustomerService: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated } = useAppContext();
  const { incrementUnread, resetUnread } = useCSNotification();
  const [step, setStep] = useState<'form' | 'conversation'>('form');
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    message: ''
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isLoadingMessagesRef = useRef(false);

  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const [isReloading, setIsReloading] = useState(false);
  
  // Attachment states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Subscriptions ref for cleanup
  const subscriptionsRef = useRef<any[]>([]);

  // Notification sound function
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (err) {
      console.log('Notification sound error:', err);
    }
  };

  // Browser notification function
  const showBrowserNotification = (message: string) => {
    if (Notification.permission === 'granted') {
      new Notification('New Message from Support', {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('New Message from Support', {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
          });
        }
      });
    }
  };

  // Vibration function for mobile
  const triggerVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  // Combined notification function
  const triggerNotifications = (message: string) => {
    playNotificationSound();
    showBrowserNotification(message);
    triggerVibration();
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, WEBP, or PDF files only.',
        variant: 'destructive'
      });
      event.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
        variant: 'destructive'
      });
      event.target.value = '';
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

  const uploadAttachment = async (file: File): Promise<{url: string, type: string, name: string, size: number} | null> => {
    if (!user?.id) {
      console.error('[CustomerService] Upload failed: User not authenticated');
      toast({
        title: 'Upload failed',
        description: 'You must be logged in to upload files.',
        variant: 'destructive'
      });
      return null;
    }

    console.log('[CustomerService] Upload started:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: user.id
    });

    setIsUploading(true);

    // Add timeout guard (20 seconds)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Upload timeout after 20 seconds'));
      }, 20000);
    });

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${timestamp}-${randomString}-${sanitizedName}`;

      console.log('[CustomerService] Upload destination:', {
        bucket: 'chat-attachments',
        path: filePath
      });

      // Race between upload and timeout
      const uploadPromise = supabase
        .storage
        .from('chat-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      const { error: uploadError, data } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (uploadError) {
        console.error('[CustomerService] Supabase upload error:', uploadError);
        toast({
          title: 'Upload failed',
          description: uploadError.message || 'Failed to upload file to storage.',
          variant: 'destructive'
        });
        return null;
      }

      console.log('[CustomerService] Upload successful:', { data });

      const { data: { publicUrl } } = supabase
        .storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      console.log('[CustomerService] Public URL generated:', publicUrl);

      return {
        url: publicUrl,
        type: file.type,
        name: file.name,
        size: file.size
      };
    } catch (error: any) {
      console.error('[CustomerService] Upload exception:', error);
      const errorMessage = error.message === 'Upload timeout after 20 seconds'
        ? 'Upload timed out. Please try again with a smaller file or check your connection.'
        : 'Failed to upload attachment. Please try again.';

      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    } finally {
      console.log('[CustomerService] Upload state reset');
      setIsUploading(false);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for existing conversation on open
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      console.log('[CustomerService] Checking for existing conversations for user:', user.id);
      checkExistingConversation();
      // Reset unread count when chat is opened
      resetUnread();
    }
  }, [isOpen, isAuthenticated, user, resetUnread]);

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      console.log('[CustomerService] Cleaning up subscriptions');
      subscriptionsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      subscriptionsRef.current = [];
    };
  }, []);

  // Real-time subscription for messages and conversation status
  useEffect(() => {
    if (!conversation?.id) return;

    console.log('[CustomerService] Setting up realtime subscriptions for conversation:', conversation.id);

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('[CustomerService] Realtime message received:', payload);

          const newMsg = payload.new as any;
          
          // Prevent duplicates using processed IDs
          if (processedMessageIds.current.has(newMsg.id)) {
            console.log('[CustomerService] Duplicate message ignored:', newMsg.id);
            return;
          }
          processedMessageIds.current.add(newMsg.id);

          const transformedMsg: Message = {
            id: newMsg.id,
            content: newMsg.message,
            is_admin: newMsg.sender === 'admin',
            created_at: newMsg.created_at,
            attachment_url: newMsg.attachment_url,
            attachment_type: newMsg.attachment_type,
            attachment_name: newMsg.attachment_name,
            attachment_size: newMsg.attachment_size
          };

          setMessages((prev: Message[]) => {
            const exists = prev.some((m) => m.id === transformedMsg.id);
            if (exists) return prev;
            
            console.log('[CustomerService] Adding new message to state:', transformedMsg.id);
            return [...prev, transformedMsg];
          });

          // Show notification for admin messages
          if (transformedMsg.is_admin) {
            setHasNewMessage(true);
            incrementUnread();
            triggerNotifications('Customer service has responded to your message.');
            toast({
              title: 'New reply from support',
              description: 'Customer service has responded to your message.',
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[CustomerService] Messages subscription error:', status);
        }
      });

    // Subscribe to conversation status changes
    const conversationChannel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversation.id}`,
        },
        (payload) => {
          console.log('[CustomerService] Conversation status update received:', payload);
          const updatedConv = payload.new as any;
          
          setConversation(prev => {
            if (!prev) return null;
            return { ...prev, status: updatedConv.status, updated_at: updatedConv.updated_at };
          });

          if (updatedConv.status === 'closed') {
            toast({
              title: 'Conversation Closed',
              description: 'This conversation has been closed by support.',
              variant: 'destructive',
            });
          } else if (updatedConv.status === 'pending') {
            toast({
              title: 'Conversation Updated',
              description: 'Your conversation status has been updated to pending.',
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error('[CustomerService] Conversation subscription error:', status);
        }
      });

    subscriptionsRef.current = [messagesChannel, conversationChannel];

    return () => {
      console.log('[CustomerService] Removing realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(conversationChannel);
      subscriptionsRef.current = [];
    };
  }, [conversation?.id]);

  // Check for existing conversations from Supabase
  const checkExistingConversation = useCallback(async () => {
    if (!user?.id) {
      console.log('[CustomerService] No user ID available');
      return;
    }
    
    console.log('[CustomerService] Checking for existing conversations for user:', user.id);
    
    try {
      // Check for ANY conversation (not just open) to allow reopening
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'pending'])
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[CustomerService] Error checking conversations:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('[CustomerService] Found existing conversation:', data[0].id, 'Status:', data[0].status);
        setConversation(data[0]);
        await loadMessages(data[0].id);
        setStep('conversation');
      } else {
        console.log('[CustomerService] No existing open/pending conversations found');
      }
    } catch (error) {
      console.error('[CustomerService] Error checking conversations:', error);
    }
  }, [user?.id]);

  const loadMessages = async (conversationId: string, isPolling = false) => {
    if (!conversationId) return;
    
    // Prevent overlapping fetches
    if (isPolling && isLoadingMessagesRef.current) {
      console.log('[CustomerService] Skipping message load - already in progress');
      return;
    }
    
    if (!isPolling) setIsReloading(true);
    isLoadingMessagesRef.current = true;
    
    console.log('[CustomerService] Loading messages for conversation:', conversationId);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[CustomerService] Error loading messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load messages',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        console.log('[CustomerService] Loaded', data.length, 'messages');
        
        // Track all loaded message IDs to prevent duplicates
        data.forEach(msg => processedMessageIds.current.add(msg.id));
        
        const transformedMessages = data.map(msg => ({
          id: msg.id,
          content: msg.message,
          is_admin: msg.sender === 'admin',
          created_at: msg.created_at
        }));
        
        setMessages(transformedMessages);
        setLastMessageCount(data.length);
      }
    } catch (error) {
      console.error('[CustomerService] Error loading messages:', error);
    } finally {
      isLoadingMessagesRef.current = false;
      if (!isPolling) setIsReloading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      console.error('[CustomerService] User not authenticated');
      alert('Please sign in to use customer service');
      return;
    }

    const messageText = formData.message.trim();
    if (!messageText) {
      console.error('[CustomerService] Empty message submitted');
      return;
    }

    console.log('[CustomerService] Creating new conversation for user:', user.id);
    setIsLoading(true);

    let dbSaveSuccess = false;
    let newConversation: any = null;
    let savedMessage: any = null;
    
    // Add timeout guard (30 seconds for new conversation)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Submission timeout after 30 seconds'));
      }, 30000);
    });

    try {
      // Race between submission and timeout
      const submissionPromise = (async () => {
        // Create conversation in Supabase
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            user_email: user.email,
            status: 'open'
          })
          .select()
          .single();

        if (convError || !convData) {
          console.error('[CustomerService] Error creating conversation:', convError);
          throw new Error(convError?.message || 'Failed to create conversation');
        }

        console.log('[CustomerService] Conversation created:', convData.id);
        newConversation = convData;

        // Save message to Supabase
        const { data: msgData, error: msgError } = await supabase
          .from('messages')
          .insert({
            conversation_id: newConversation.id,
            sender: 'user',
            message: messageText
          })
          .select()
          .single();

        if (msgError) {
          console.error('[CustomerService] Error saving message:', msgError);
          throw new Error(msgError?.message || 'Failed to save message');
        }

        console.log('[CustomerService] Message saved:', msgData?.id);
        savedMessage = msgData;
        dbSaveSuccess = true;

        // Track message ID to prevent duplicate
        if (savedMessage?.id) {
          processedMessageIds.current.add(savedMessage.id);
        }

        // Set conversation and message in state
        setConversation(newConversation);
        setMessages([{
          id: savedMessage?.id || crypto.randomUUID(),
          content: messageText,
          is_admin: false,
          created_at: savedMessage?.created_at || new Date().toISOString()
        }]);
        setStep('conversation');
        setFormData({ full_name: '', phone_number: '', message: '' });

        console.log('[CustomerService] DB save completed successfully');
        return { newConversation, savedMessage };
      })();

      await Promise.race([submissionPromise, timeoutPromise]);

      // Show success immediately after DB save
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent. Our team will assist you shortly.',
      });

      // Send Telegram notification in background (non-blocking)
      if (dbSaveSuccess && newConversation) {
        sendToTelegram(messageText, 'new_ticket', newConversation.id).catch(err => {
          console.error('[CustomerService] Telegram notification failed (non-blocking):', err);
        });
      }
    } catch (error: any) {
      console.error('[CustomerService] Error submitting message:', error);
      
      // If DB save succeeded before timeout, show success instead of error
      if (dbSaveSuccess && newConversation && savedMessage) {
        console.log('[CustomerService] DB save succeeded before timeout, showing success');
        toast({
          title: 'Message Sent',
          description: 'Your message has been sent. Our team will assist you shortly.',
        });
        
        // Send Telegram notification in background (non-blocking)
        sendToTelegram(messageText, 'new_ticket', newConversation.id).catch(err => {
          console.error('[CustomerService] Telegram notification failed (non-blocking):', err);
        });
        return;
      }
      
      const errorMessage = error.message === 'Submission timeout after 30 seconds'
        ? 'Request timed out. Please check your connection and try again.'
        : error.message || 'Failed to send message. Please try again.';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      console.log('[CustomerService] Submission completed, resetting loading state');
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    const messageText = newMessage.trim();

    // Allow sending if there's text OR an attachment
    if ((!messageText && !selectedFile) || !conversation || isSending || isUploading) {
      console.log('[CustomerService] Cannot send - empty message and no attachment', {
        hasMessage: !!messageText,
        hasFile: !!selectedFile,
        hasConversation: !!conversation,
        isSending,
        isUploading
      });
      return;
    }

    // Prevent sending if conversation is closed
    if (conversation.status === 'closed') {
      console.error('[CustomerService] Cannot send message - conversation is closed');
      toast({
        title: 'Conversation Closed',
        description: 'This conversation has been closed. Please start a new conversation.',
        variant: 'destructive'
      });
      return;
    }

    console.log('[CustomerService] Sending message to conversation:', conversation.id);
    setIsSending(true);
    setErrorMessage('');

    // Generate temp ID for optimistic update
    const tempId = crypto.randomUUID();

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: tempId,
      content: messageText,
      is_admin: false,
      created_at: new Date().toISOString(),
      attachment_url: attachmentPreview || undefined,
      attachment_type: selectedFile?.type,
      attachment_name: selectedFile?.name
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    let attachmentData: {url: string, type: string, name: string, size: number} | null = null;

    // Upload attachment if present
    if (selectedFile) {
      console.log('[CustomerService] Starting attachment upload before sending message');
      attachmentData = await uploadAttachment(selectedFile);
      if (!attachmentData) {
        console.log('[CustomerService] Attachment upload failed, cancelling message send');
        // Upload failed - remove optimistic message
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        setIsSending(false);
        return;
      }
      console.log('[CustomerService] Attachment upload successful, proceeding with message send');
    }

    let dbSaveSuccess = false;
    let savedMessage: any = null;

    // Add timeout guard (60 seconds for message sending)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Message send timeout after 60 seconds'));
      }, 60000);
    });

    try {
      // Race between message send and timeout
      const messageSendPromise = (async () => {
        // Build message insert data
        const messageData: any = {
          conversation_id: conversation.id,
          sender: 'user',
          message: messageText || null
        };

        // Add attachment data if present
        if (attachmentData) {
          messageData.attachment_url = attachmentData.url;
          messageData.attachment_type = attachmentData.type;
          messageData.attachment_name = attachmentData.name;
          messageData.attachment_size = attachmentData.size;
        }

        // Save message to Supabase
        const { data: msgData, error } = await supabase
          .from('messages')
          .insert(messageData)
          .select()
          .single();

        if (error) {
          console.error('[CustomerService] Error saving message:', error);
          throw error;
        }

        console.log('[CustomerService] Message saved to Supabase:', msgData?.id);
        savedMessage = msgData;
        dbSaveSuccess = true;

        // Clear attachment after successful send
        clearAttachment();

        // Track the real message ID
        if (savedMessage?.id) {
          processedMessageIds.current.add(savedMessage.id);

          // Replace temp message with real one
          setMessages(prev => prev.map(msg =>
            msg.id === tempId ? {
              id: savedMessage.id,
              content: messageText,
              is_admin: false,
              created_at: savedMessage.created_at,
              attachment_url: savedMessage.attachment_url
            } : msg
          ));
        }

        console.log('[CustomerService] DB save completed successfully');
        return savedMessage;
      })();

      await Promise.race([messageSendPromise, timeoutPromise]);

      // Show success immediately after DB save
      toast({
        title: 'Message Sent',
        description: attachmentData
          ? 'Your message and attachment have been sent to customer service.'
          : 'Your message has been sent to customer service.',
      });

      // Send Telegram notification in background (non-blocking)
      if (dbSaveSuccess && conversation) {
        const telegramText = attachmentData
          ? `${messageText || ''}\n\n[Attachment: ${attachmentData.name}]`.trim()
          : messageText;
        sendToTelegram(telegramText, 'reply', conversation.id).catch(err => {
          console.error('[CustomerService] Telegram notification failed (non-blocking):', err);
        });
      }
    } catch (error: any) {
      console.error('[CustomerService] Error sending message:', error);

      // If DB save succeeded before timeout, show success instead of error
      if (dbSaveSuccess && savedMessage) {
        console.log('[CustomerService] DB save succeeded before timeout, showing success');
        toast({
          title: 'Message Sent',
          description: attachmentData
            ? 'Your message and attachment have been sent to customer service.'
            : 'Your message has been sent to customer service.',
        });

        // Send Telegram notification in background (non-blocking)
        const telegramText = attachmentData
          ? `${messageText || ''}\n\n[Attachment: ${attachmentData.name}]`.trim()
          : messageText;
        sendToTelegram(telegramText, 'reply', conversation.id).catch(err => {
          console.error('[CustomerService] Telegram notification failed (non-blocking):', err);
        });
        return;
      }

      setErrorMessage(`Failed to send: ${error.message}`);

      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));

      const errorMessage = error.message === 'Message send timeout after 60 seconds'
        ? 'Request timed out. Please check your connection and try again.'
        : error.message || 'Failed to send message. Please try again.';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Send messages to Telegram CS Bot via Supabase Edge Function
  const sendToTelegram = async (message: string, type: 'new_ticket' | 'reply', convId: string) => {
    try {
      console.log('[CustomerService] Sending Telegram notification for', type);
      
      const userInfo = user ? `👤 User: ${user.display_name || user.email}` : '👤 Guest User';
      const userId = user ? `🆔 ID: ${user.id}` : '';
      const convInfo = `💬 Conversation: ${convId}`;
      
      let prefix = '';
      if (type === 'new_ticket') {
        prefix = '🟢 ONLINE CS - NEW SUPPORT TICKET';
      } else if (type === 'reply') {
        prefix = '💬 ONLINE CS - USER REPLY';
      }
      
      const fullMessage = `${prefix}
${userInfo}
${userId}
${convInfo}
⏰ Time: ${new Date().toLocaleString()}

📝 Message:
${message}

Reply via Telegram to respond to customer.`;
      
      // Call Supabase Edge Function instead of direct Telegram API
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { message: fullMessage }
      });
      
      if (error) {
        console.error('[CustomerService] Failed to send message to Telegram via Edge Function:', error);
      } else {
        console.log('[CustomerService] Telegram notification sent successfully via Edge Function');
      }
    } catch (error) {
      console.error('[CustomerService] Error sending to Telegram:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md h-[90vh] sm:h-auto sm:max-h-[90vh] bg-gradient-to-br from-purple-600 via-pink-600 to-purple-700 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md p-6 border-b border-white/[0.1]">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.1]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center animate-pulse">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Online Customer Service</h3>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step === 'conversation' && conversation && (
                <button
                  onClick={() => loadMessages(conversation.id)}
                  disabled={isReloading}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
                  title="Reload messages"
                >
                  <RefreshCw className={`w-4 h-4 text-white ${isReloading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'form' ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-3">
                  WELCOME TO EARNINGSLLC CUSTOMER SERVICE
                </h2>
                <p className="text-white/90 text-sm leading-relaxed">
                  IF YOU ARE HAVING ANY ISSUES WE ARE HERE TO SUPPORT YOU. 24/7 ACTIVELY WORKING.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">
                    FULL NAME:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    PHONE NUMBER:
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">
                    How can we assist you!
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all resize-none"
                    placeholder="Describe your issue in detail..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isAuthenticated}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isLoading ? 'Submitting...' : 'Submit'}
                </button>
              </form>

              {!isAuthenticated && (
                <div className="text-center text-white/80 text-sm">
                  Please sign in to use customer service
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
              {/* NEW MESSAGE Notification */}
              {hasNewMessage && (
                <button
                  onClick={() => {
                    setHasNewMessage(false);
                   messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
                  }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-3 rounded-xl font-bold text-sm animate-bounce shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  NEW MESSAGE - CLICK TO VIEW
                </button>
              )}

              {/* Ticket Info with Status */}
              {conversation && (
                <div className="bg-white/10 rounded-xl p-3 border border-white/20 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-xs">Conversation #{conversation.id.slice(0, 8)}</p>
                      <p className="text-white font-semibold">{conversation.user_email || user?.email}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      conversation.status === 'open' 
                        ? 'bg-green-500/20 text-green-300' 
                        : conversation.status === 'pending'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {conversation.status === 'open' ? (
                        <Unlock className="w-3 h-3" />
                      ) : conversation.status === 'pending' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {conversation.status}
                    </div>
                  </div>
                  {conversation.status === 'closed' && (
                    <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-300 text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        This conversation has been closed. You cannot send new messages.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Messages - Flex grow to take available space */}
              <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${ 
  msg.is_admin
    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30'
    : 'bg-white/10 border border-white/20 ml-auto'
} rounded-xl p-4 max-w-[85%]`}
                  >
                    {msg.is_admin ? (
                      <div className="text-center">
                        <p className="text-white font-bold text-sm">
                          SUPPORT AGENT
                        </p>
                        {/* Attachment display for admin messages */}
                        {msg.attachment_url && (
                          <div className="mt-2">
                            {msg.attachment_type?.startsWith('image/') ? (
                              <a 
                                href={msg.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-white/20 hover:border-purple-400/50 transition-colors"
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
                                className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-purple-400/50 transition-all"
                              >
                                <FileText className="w-5 h-5 text-purple-400" />
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
                        {msg.content && (
                          <p className="text-white/90 mt-2">{msg.content}</p>
                        )}
                        <p className="text-white/60 text-xs mt-2">{formatTime(msg.created_at)}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/80 text-xs font-semibold">You</span>
                          <span className="text-white/60 text-xs">{formatTime(msg.created_at)}</span>
                        </div>
                        {/* Attachment display for user messages */}
                        {msg.attachment_url && (
                          <div className="mb-2">
                            {msg.attachment_type?.startsWith('image/') ? (
                              <a 
                                href={msg.attachment_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block rounded-lg overflow-hidden border border-white/20 hover:border-pink-400/50 transition-colors"
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
                                className="flex items-center gap-2 p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-pink-400/50 transition-all"
                              >
                                <FileText className="w-5 h-5 text-pink-400" />
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
                        {msg.content && (
                          <p className="text-white/90 text-sm leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input - Fixed at bottom */}
              {errorMessage && (
                <div className="text-amber-400 text-xs text-center py-2">
                  {errorMessage}
                </div>
              )}
              
              {/* Start New Conversation Button (shown when closed) */}
              {conversation?.status === 'closed' && (
                <div className="flex-shrink-0">
                  <button
                    onClick={() => {
                      console.log('[CustomerService] Starting new conversation');
                      setStep('form');
                      setConversation(null);
                      setMessages([]);
                      processedMessageIds.current.clear();
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all"
                  >
                    Start New Conversation
                  </button>
                </div>
              )}
              
              {/* Reply Input (hidden when closed) */}
              {conversation?.status !== 'closed' && (
                <div className="flex-shrink-0">
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
                            <FileText className="w-12 h-12 text-pink-400" />
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

                  {/* Input Area */}
                  <div className="flex gap-2">
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
                      className="px-3 py-3 bg-white/20 border border-white/30 rounded-xl text-white hover:bg-white/25 hover:border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Attach file (JPG, PNG, WEBP, PDF - Max 10MB)"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {/* Message Input */}
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                      placeholder={conversation?.status === 'pending' ? 'Conversation pending - you can still reply...' : 'Type your message...'}
                      disabled={isSending || isUploading}
                      className="flex-1 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-all disabled:opacity-50"
                    />
                    
                    {/* Send Button */}
                    <button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
                      className="px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Telegram Option */}
        <div className="bg-white/10 backdrop-blur-md p-4 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="text-white/80 text-xs">
              24/7 Customer Support
            </div>
            <a
              href="https://t.me/earningsllc_support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors text-xs font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              TELEGRAM SUPPORT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService;
