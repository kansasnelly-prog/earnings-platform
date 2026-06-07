import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { supabase } from '@/lib/supabase';
import { Globe } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_own: boolean;
}

const PremiumChatView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [nellyCoins, setNellyCoins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    loadUserBalance();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages = (data || []).map((msg: any) => ({
        ...msg,
        is_own: msg.sender_id === user.id,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setNellyCoins(data?.balance || 0);
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageFee = 1; // Conversational fee per message

    if (nellyCoins < messageFee) {
      alert(`Insufficient NellyCoins. You need ${messageFee} NellyCoin to send a message.`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Deduct conversational fee
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance: nellyCoins - messageFee })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      setNellyCoins(nellyCoins - messageFee);

      // Send message
      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          content: newMessage.trim(),
        });

      if (messageError) throw messageError;

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleTranslateMessage = (messageId: string, content: string) => {
    // Mock translation - in production, this would call a translation API
    const mockTranslations: Record<string, string> = {
      'Hello': 'សួស្តី',
      'Hi': 'សួស្តី',
      'How are you?': 'តើអ្នកសុខសប្បាយជាមណា?',
      'Good morning': 'អរុណសួស្តី',
      'Good night': 'រកសុខសប្បាយ',
      'Thank you': 'សូមអរគុណ',
      'Yes': 'បាទ/ចាស',
      'No': 'ទេ',
      'I love you': 'ខ្ញុំស្រល់អ្នក',
      'See you later': 'ជួបគ្នាពេលក្រោយ',
    };

    // Simple mock translation - check if content matches any known phrase
    let translated = mockTranslations[content];
    if (!translated) {
      // If no exact match, add a prefix to indicate it's translated
      translated = `[KH] ${content}`;
    }

    setTranslatedMessages(prev => ({
      ...prev,
      [messageId]: translated
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-pink-900 to-red-900 p-4">
      <div className="max-w-md mx-auto h-screen flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Premium Chat</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
            </Button>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-bold">{nellyCoins}</span>
              <span className="text-white text-sm ml-1">NC</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <Card
          className="flex-1 backdrop-blur-xl border-2 border-red-500/30 mb-4 overflow-hidden"
          style={{
            background: 'rgba(153, 27, 27, 0.1)',
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
          }}
        >
          <CardContent className="p-4 h-full overflow-y-auto">
            {loading ? (
              <div className="text-center text-white">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400">
                <p className="text-4xl mb-2">💬</p>
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex flex-col items-end gap-1">
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 ${
                          message.is_own
                            ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
                            : 'bg-white/10 text-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {translatedMessages[message.id] && (
                          <p className="text-sm mt-2 text-yellow-300 font-semibold">
                            {translatedMessages[message.id]}
                          </p>
                        )}
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTranslateMessage(message.id, message.content)}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <Globe size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Input */}
        <Card
          className="backdrop-blur-xl border-2 border-red-500/30"
          style={{
            background: 'rgba(153, 27, 27, 0.1)',
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
          }}
        >
          <CardContent className="p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-white/10 border border-red-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold px-6 rounded-lg hover:scale-105 transition-all duration-300"
              >
                Send
              </Button>
            </div>
            <p className="text-red-300 text-xs mt-2">
              💰 Conversational fee: 1 NellyCoin per message
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PremiumChatView;
