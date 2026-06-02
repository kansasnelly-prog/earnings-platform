import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, Copy, CheckCircle2, Info } from 'lucide-react';
import { useCreditBalance } from '../hooks/useCreditBalance';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '../contexts/SafeAuthProvider'; // Import useAuth
import MonetizationBanner from '../components/MonetizationBanner';

interface AISuggestion {
  type: string;
  content: string;
}

const AIAssistantWorkspace = () => {
  const navigate = useNavigate();
  const [customerMessage, setCustomerMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [aiStatus, setAiStatus] = useState<'online' | 'offline'>('offline');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const { user } = useAuth(); // Get the current user from AuthContext
  const { creditBalance, isLoading: isLoadingCredits, spendCredits, refreshCreditBalance } = useCreditBalance();

  // Heartbeat logic for active attention tracking
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const sendHeartbeat = async () => {
      if (user?.id && document.visibilityState === 'visible') {
        try {
          // Assuming a new API route for heartbeat or using an existing one
          // For now, let's assume a simple endpoint that triggers credit calculation
          const response = await fetch('/api/monetization', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'trackActivity', userId: user.id, activityDuration: 1 }), // 1 minute of activity
          });

          if (response.ok) {
            console.log('Heartbeat sent successfully.');
            // Refresh credit balance immediately after a successful heartbeat
            await refreshCreditBalance();
          } else {
            console.error('Failed to send heartbeat:', response.statusText);
          }
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    };

    intervalId = setInterval(sendHeartbeat, 60000); // Every 60 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [user, refreshCreditBalance]);

  const handleUpgradeToPro = async () => {
    if (!user?.id) {
      toast.error('User not logged in.');
      return;
    }

    try {
      const response = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          priceId: 'price_12345', // Replace with your actual Stripe Price ID for $1.50 or $2.00 / month
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to create Stripe checkout session.');
      }
    } catch (error) {
      console.error('Error creating Stripe checkout session:', error);
      toast.error('Error creating Stripe checkout session.');
    }
  };

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!customerMessage.trim()) {
      toast.error('Please paste a customer message first');
      return;
    }

    // Admin bypass: if the logged in user is an admin, skip credit checks
    const isAdmin = user?.account_type === 'admin';
    if (isAdmin) {
      // Pretend we have plenty of credits
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      spendCredits(0); // no actual deduction
    } else {
      if (creditBalance === null || creditBalance <= 0) {
        setShowCreditModal(true);
        return;
      }
      const spent = await spendCredits(1); // Deduct 1 credit for using the AI tool
      if (!spent) {
        toast.error('Failed to deduct credits. Please try again.');
        return;
      }
    }

    // No additional credit deduction needed for admins

    setIsGenerating(true);
    setSuggestions([]);

    try {
      const response = await fetch('/api/generate-ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: customerMessage,
          conversationHistory: []
        })
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[AIAssistantWorkspace] API error:', text);
        toast.error(text || 'Failed to generate suggestions');
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('[AIAssistantWorkspace] Non-JSON response:', text);
        toast.error('Server returned invalid response format');
        return;
      }

      const data = await response.json();

      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        toast.success('Generated 5 professional response options');
      } else {
        console.error('[AIAssistantWorkspace] Error:', data.error);
        toast.error(data.error || 'Failed to generate suggestions');
      }
    } catch (error) {
      console.error('[AIAssistantWorkspace] Exception:', error);
      toast.error('Failed to connect to AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success('Response copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toneColors: Record<string, string> = {
    'PROFESSIONAL': 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    'EMPATHETIC': 'border-green-500 bg-green-50 dark:bg-green-950',
    'SHORT': 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    'DETAILED': 'border-purple-500 bg-purple-50 dark:bg-purple-950',
    'TECHNICAL': 'border-red-500 bg-red-50 dark:bg-red-950'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-white/10 hover:scale-[1.01] transition-all">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-purple-600" />
                KANSAS NELLY'S AI
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Professional response generator for difficult customer messages
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Platform Rules Reference */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Platform Rules Reference
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Quick reference for TASKS REWARD HUB operations
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                      Platform Name
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                      TASKS REWARD (also known as TASK REWARD HUB)
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                      Core Function
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                      We help merchants improve product visibility to the audience/public for products that have low sales. Users recognize, click, and submit these products to boost their visibility.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
                      Earning Mechanism
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">
                      Companies and merchants pay us for the product submissions rendered, and users earn rewards for completing these tasks.
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Main Account Rule
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      Users must complete their first set of 35/35 tasks. Once finished, they MUST contact Customer Service to request a manual account reset before they can continue earning.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Training Account Rule
                    </h3>
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      Users in the training account must complete their first set of 45/45 tasks. Once finished, they MUST contact Customer Service to request a training account reset.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Paste & Reply Tool */}
          <div className="lg:col-span-2 space-y-6">
            <MonetizationBanner />
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Paste & Reply Tool
                </CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Paste a difficult customer message below to generate professional response options</span>
                  {isLoadingCredits ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">Loading credits...</span>
                  ) : (
                    <span className="text-sm text-slate-500 dark:text-slate-400">Credits remaining: {creditBalance}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Customer Message
                  </label>
                  <Textarea
                    placeholder="Paste the customer's message here..."
                    value={customerMessage}
                    onChange={(e) => setCustomerMessage(e.target.value)}
                    className="min-h-[200px] text-base"
                  />
                </div>

                <Button
                  onClick={handleGenerateSuggestions}
                  disabled={isGenerating || !customerMessage.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                      Generating Professional Answers...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Professional Answers
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Credit Modal */}
            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upgrade to Pro Tier</DialogTitle>
                  <DialogDescription>
                    You have run out of credits. Subscribe to our Pro Tier to continue using AI chat features and premium optimization tools.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreditModal(false)}>
                    Maybe Later
                  </Button>
                  <Button onClick={handleUpgradeToPro} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                    Upgrade to Pro Tier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Results Section */}
            {suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Response Options</CardTitle>
                  <CardDescription>
                    5 professional variations tailored to your customer's message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${toneColors[suggestion.type] || 'border-slate-300 bg-slate-50 dark:bg-slate-800'}`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {suggestion.type}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(suggestion.content, index)}
                          className="flex items-center gap-2"
                        >
                          {copiedIndex === index ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {suggestion.content}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantWorkspace;