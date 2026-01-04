'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, UIMessage } from '@ai-sdk/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CitationData {
  source: string;
  page: string;
  text: string;
}

function SourceBadge({ citation, onClick }: { citation: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="mt-2 h-auto py-1 px-3 bg-[#10b981]/10 hover:bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981] text-xs"
    >
      {citation}
    </Button>
  );
}

export default function FinancialAnalysisChat() {
  const [input, setInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load input from localStorage on mount
  useEffect(() => {
    const savedInput = localStorage.getItem('lumenfin_chat_input');
    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  // Save input to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lumenfin_chat_input', input);
  }, [input]);

  const { 
    messages, 
    status,
    setMessages,
    error 
  } = useChat({
    onError: (error: Error) => {
      console.error("Chat error:", error);
    }
  });

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('lumenfin_chat_messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    }
    setIsLoaded(true);
  }, [setMessages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lumenfin_chat_messages', JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    localStorage.removeItem('lumenfin_chat_input');

    // Create properly formatted UIMessage with parts
    const userMsg: UIMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      parts: [{ type: 'text', text: userMessage }]
    };
    
    setMessages([...messages, userMsg]);

    try {
      // Make API call manually
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.parts.filter(p => p.type === 'text').map(p => p.text).join('')
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        const assistantId = (Date.now() + 1).toString();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          const assistantMsg: UIMessage = { 
            id: assistantId, 
            role: 'assistant', 
            parts: [{ type: 'text', text: assistantMessage }]
          };
          setMessages([...messages, userMsg, assistantMsg]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: UIMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        parts: [{ 
          type: 'text', 
          text: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` 
        }]
      };
      setMessages([...messages, userMsg, errorMsg]);
    }
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [citationModal, setCitationModal] = useState<{
    isOpen: boolean;
    citation: CitationData | null;
  }>({
    isOpen: false,
    citation: null,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCitationClick = (citationText: string) => {
    const match = citationText.match(/\[Source \d+: (.+?), Page (\d+)\]/);
    if (match) {
      const [, source, page] = match;
      setCitationModal({
        isOpen: true,
        citation: {
          source,
          page,
          text: "Citation details not available in this view.", 
        },
      });
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[Source \d+: .+?, Page \d+\])/g);
    
    return parts.map((part, index) => {
      if (part.match(/\[Source \d+: .+?, Page \d+\]/)) {
        return (
          <SourceBadge
            key={index}
            citation={part}
            onClick={() => handleCitationClick(part)}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl h-full border border-[#1e293b] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#1e293b]/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-1">AI Financial Analyst</h2>
            <p className="text-xs text-slate-500">Powered by Cerebras Llama 3.3</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Real-time
            </Badge>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="mb-6 p-6 bg-gradient-to-br from-[#10b981]/10 to-purple-500/10 rounded-2xl border border-[#10b981]/20">
                <Sparkles className="text-[#10b981] mx-auto" size={56} />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white mb-3">
                Start Your Financial Analysis
              </h3>
              <p className="text-slate-400 max-w-md leading-relaxed">
                Upload financial documents to the vault and ask me anything. I'll provide detailed analysis with source citations.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => {
                // Extract text content from parts
                const content = message.parts
                  ? message.parts
                      .filter(part => part.type === 'text')
                      .map(part => part.text)
                      .join('')
                  : ''; // Fallback if parts is undefined (though it shouldn't be)

                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-[#10b981] text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] rounded-2xl p-4 ${
                        message.role === 'user'
                          ? 'bg-[#10b981]/10 text-white border border-[#10b981]/20'
                          : 'bg-[#1e293b]/50 text-slate-200 border border-[#1e293b]'
                      }`}
                    >
                      <div className="leading-relaxed whitespace-pre-wrap">
                        {renderMessageContent(content)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="bg-[#1e293b]/50 rounded-2xl p-4 border border-[#1e293b] flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span className="text-sm text-slate-400">Analyzing financial data...</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex gap-4">
                   <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="bg-red-900/20 rounded-2xl p-4 border border-red-900/50 text-red-200">
                    Error: {error.message || "Something went wrong. Please check your API key."}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-[#1e293b]/50 bg-[#0f172a]/50">
          <form onSubmit={handleSubmit} className="relative">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything about your financial documents..."
              className="w-full bg-[#1e293b]/50 text-white placeholder:text-slate-500 rounded-xl py-4 pl-6 pr-14 border border-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all ${
                input.trim() && !isLoading
                  ? 'bg-[#10b981] hover:bg-[#059669] text-white'
                  : 'bg-[#334155] text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="text-center text-xs text-slate-600 mt-3">
            AI responses may contain inaccuracies. Always verify with source documents.
          </p>
        </div>
      </div>

      {/* Citation Modal */}
      <Dialog open={citationModal.isOpen} onOpenChange={(open) => setCitationModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-[#0f172a] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#10b981]" />
              Source Citation
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {citationModal.citation?.source}, Page {citationModal.citation?.page}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 bg-[#1e293b]/50 rounded-lg border border-[#1e293b]">
            <p className="text-sm leading-relaxed text-slate-300">
              {citationModal.citation?.text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
