import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Sparkles, Copy, CheckCircle2, Info } from 'lucide-react';

interface AISuggestion {
  type: string;
  content: string;
}

const AIAssistantWorkspace = () => {
  const navigate = useNavigate();
  const [customerMessage, setCustomerMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerateSuggestions = async () => {
    if (!customerMessage.trim()) {
      toast.error('Please paste a customer message first');
      return;
    }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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
                AI Assistant Workspace
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
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Paste & Reply Tool
                </CardTitle>
                <CardDescription>
                  Paste a difficult customer message below to generate professional response options
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
