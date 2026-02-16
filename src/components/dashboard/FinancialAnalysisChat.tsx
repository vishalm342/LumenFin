'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Sparkles, Loader2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat, type UIMessage } from '@ai-sdk/react';
import Sidebar from './Sidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CitationData {
  source: string;
  page: string | number;
  text: string;
  fileName?: string;
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

interface FinancialAnalysisChatProps {
  currentChatId: string;
  onChatIdChange: (id: string) => void;
}

export default function FinancialAnalysisChat({ currentChatId, onChatIdChange }: FinancialAnalysisChatProps) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState(0);
  const prevMessagesLengthRef = useRef<number>(0);

  // Initialize useChat hook with proper configuration from @ai-sdk/react
  const chatHelpers = useChat({
    onError: (error: Error) => {
      console.error("Chat error:", error);
    },
    onFinish: () => {
      // Trigger sidebar refresh in case title was auto-generated or timestamp updated
      setRefreshSidebarTrigger(prev => prev + 1);
    },
  });

  const { messages, status, setMessages, error } = chatHelpers;

  // Manage input and loading state manually
  const [input, setInput] = useState('');
  const [isLoadingManual, setIsLoadingManual] = useState(false);
  const isLoading = status === 'streaming' || status === 'submitted' || isLoadingManual;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoadingManual(true);
    
    try {
      // Manually call the API with chatId included
      const newUserMsg: UIMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        parts: [{ type: 'text', text: userMessage }],
      };
      const newMessages = [...messages, newUserMsg];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ 
            role: m.role, 
            content: m.parts?.filter(p => p.type === 'text').map(p => (p as any).text).join('') || ''
          })), 
          chatId: currentChatId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Update messages with user message
      setMessages(newMessages);

      // Read and process the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;
          
          // Update messages with the growing assistant response
          const assistantMsg: UIMessage = {
            id: assistantId,
            role: 'assistant',
            parts: [{ type: 'text', text: assistantMessage }],
          };
          
          setMessages([...newMessages, assistantMsg]);
        }
        
        // Trigger finish callback
        setRefreshSidebarTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoadingManual(false);
    }
  };

  // Load messages when chat ID changes
  useEffect(() => {
    async function loadChat() {
      if (!currentChatId || currentChatId === 'default') {
        setMessages([]);
        return;
      }

      try {
        const res = await fetch(`/api/chats/${currentChatId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.chat && data.chat.messages) {
            // Transform DB messages to UIMessage format if necessary
            // Assuming DB stores them as { role, content, id } compatible with Vercel AI SDK
            setMessages(data.chat.messages);
            prevMessagesLengthRef.current = data.chat.messages.length;
          }
        } else {
          // Handle 404 or error
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to load chat", error);
        setMessages([]);
      }
    }
    loadChat();
  }, [currentChatId, setMessages]);

  const handleNewChat = async () => {
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Analysis' })
      });

      if (res.ok) {
        const data = await res.json();
        onChatIdChange(data.chat._id);
        setRefreshSidebarTrigger(prev => prev + 1);
      }
    } catch (e) {
      console.error("Failed to create new chat", e);
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

  // State to store sources from the current chat response
  const [sources, setSources] = useState<CitationData[]>([]);

  // Parse sources from message content when streaming finishes or updates
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      const content = (lastMessage as any).content || '';
      if (typeof content === 'string' && content.includes('[SOURCES_JSON]')) {
        const parts = content.split('[SOURCES_JSON]');
        if (parts.length > 1) {
          try {
            const sourcesJson = JSON.parse(parts[1]);
            setSources(sourcesJson);
            // Effectively hide the JSON block from UI by not rendering it? 
            // We can't update 'messages' state directly as useChat controls it, 
            // but we can strip it in renderMessageContent.
          } catch (e) {
            console.error("Failed to parse sources", e);
          }
        }
      }
    }
  }, [messages]);

  const handleCitationClick = (citationText: string) => {
    try {
      const pageMatch = citationText.match(/\[Page (\d+)\]/);
      if (pageMatch) {
        const pageNum = parseInt(pageMatch[1]);
        const source = sources.find(s => s.page === pageNum || s.page === pageMatch[1] || String(s.page) === String(pageNum));

        setCitationModal({
          isOpen: true,
          citation: {
            source: source?.fileName || "Uploaded Document",
            page: pageMatch[1],
            text: source?.text || "Detailed content is available in the source document.",
          },
        });
        return;
      }

      const sourceMatch = citationText.match(/\[Source (\d+): (.+?), Page (\d+)\]/);
      if (sourceMatch) {
        const [, id, source, page] = sourceMatch;
        setCitationModal({
          isOpen: true,
          citation: {
            source,
            page,
            text: "Detailed content is available in the source document.",
          },
        });
      }
    } catch (error) {
      console.error('Error handling citation click:', error);
    }
  };

  const renderMessageContent = (content: string) => {
    try {
      // Safely strip sources JSON block if present for rendering
      const cleanContent = content?.split('\n\n[SOURCES_JSON]')?.[0] || content || '';
      const parts = cleanContent.split(/(\[Page \d+\]|\[Source \d+: .+?, Page \d+\])/g);
      return parts.map((part, index) => {
        if (part?.match(/\[Page \d+\]/) || part?.match(/\[Source \d+: .+?, Page \d+\]/)) {
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
    } catch (error) {
      console.error('Error rendering message content:', error);
      return <span>{content}</span>;
    }
  };

  // isLoading is defined above

  return (
    <div className="flex h-full w-full">
      <Sidebar
        isOpen={isSidebarOpen}
        currentChatId={currentChatId}
        onSelectChat={onChatIdChange}
        onNewChat={handleNewChat}
        refreshTrigger={refreshSidebarTrigger}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="h-full w-full flex flex-col">
          <div className="bg-slate-900/50 backdrop-blur-md rounded-xl h-full border border-slate-800 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              {/* Mobile Toggle would go here if needed, keeping simple for now */}
              <div className="flex items-center gap-4">
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Analyst
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
                  <h3 className="text-2xl font-bold tracking-tight text-slate-200 mb-3">
                    Start Your Financial Analysis
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                    I can analyze your uploaded documents and cite specific pages.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message: UIMessage) => {
                    const content = (message.parts && Array.isArray(message.parts))
                      ? message.parts
                        .filter((part: any) => part && part.type === 'text')
                        .map((part: any) => (part as any).text || '')
                        .join('')
                      : (message as any).content;

                    return (
                      <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-[#10b981] text-white' : 'bg-purple-600 text-white'}`}
                        >
                          {message.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        </div>
                        <div
                          className={`flex-1 max-w-[80%] rounded-2xl p-4 ${message.role === 'user' ? 'bg-[#10b981]/10 text-slate-200 border border-[#10b981]/20' : 'bg-slate-800/50 text-slate-200 border border-slate-800'}`}
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
                      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-sm text-slate-400">Analyzing...</span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="bg-red-900/20 rounded-2xl p-4 border border-red-900/50 text-slate-200">
                        Error: {error.message}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/30">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me anything about your financial documents..."
                  className="w-full bg-slate-800/50 text-slate-200 placeholder:text-slate-500 rounded-xl py-4 pl-6 pr-14 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-[#10b981]/50 transition-all"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all ${input.trim() && !isLoading ? 'bg-[#10b981] hover:bg-[#059669] text-white' : 'bg-[#334155] text-slate-400 cursor-not-allowed'}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </form>
              <p className="text-center text-xs text-slate-600 mt-3">
                AI responses may contain inaccuracies. Always verify with source documents.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={citationModal.isOpen} onOpenChange={(open) => setCitationModal(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-slate-900/50 backdrop-blur-md border-slate-800 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-200">
              <FileText className="w-5 h-5 text-[#10b981]" />
              Source Citation
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              {citationModal.citation?.source}, Page {citationModal.citation?.page}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-6 bg-slate-800/50 rounded-xl border border-slate-800">
            <p className="text-sm leading-relaxed text-slate-200">
              {citationModal.citation?.text}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
