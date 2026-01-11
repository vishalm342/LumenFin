'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, User, Sparkles, Loader2, AlertCircle, FileText, Plus, MessageSquare, Trash2, Menu, X } from 'lucide-react';
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

interface ChatSession {
  id: string;
  title: string;
  messages: UIMessage[];
  timestamp: number;
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
  const [input, setInput] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const prevMessagesLengthRef = useRef<number>(0);

  // Load input from localStorage on mount
  useEffect(() => {
    const savedInput = localStorage.getItem(`lumenfin_chat_input_${currentChatId}`);
    if (savedInput) {
      setInput(savedInput);
    }
  }, [currentChatId]);

  // Save input to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(`lumenfin_chat_input_${currentChatId}`, input);
  }, [input, currentChatId]);

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

  // Load all chat sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('lumenfin_chat_sessions');
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setChatSessions(parsed);
      } catch (e) {
        console.error('Failed to parse saved sessions', e);
      }
    } else {
      // Initialize with default session
      const defaultSession: ChatSession = {
        id: 'default',
        title: 'New Chat',
        messages: [],
        timestamp: Date.now()
      };
      setChatSessions([defaultSession]);
      localStorage.setItem('lumenfin_chat_sessions', JSON.stringify([defaultSession]));
    }
    setIsLoaded(true);
  }, []);

  // Load messages for current chat session
  useEffect(() => {
    if (isLoaded) {
      const savedSessions = localStorage.getItem('lumenfin_chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const session = parsed.find((s: ChatSession) => s.id === currentChatId);
        if (session) {
          setMessages(session.messages);
          prevMessagesLengthRef.current = session.messages.length;
        }
      }
    }
  }, [currentChatId, isLoaded, setMessages]);

  // Save messages to current session whenever they change
  useEffect(() => {
    if (isLoaded && messages.length > 0) {
      // Only update if we have NEW messages (not just loading existing ones)
      const hasNewMessages = messages.length > prevMessagesLengthRef.current;
      
      const savedSessions = localStorage.getItem('lumenfin_chat_sessions');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const updatedSessions = parsed.map((session: ChatSession) => {
          if (session.id === currentChatId) {
            // Update title from first USER message if it's still "New Chat" and we have new messages
            let title = session.title;
            if (hasNewMessages && title === 'New Chat' && messages.length > 0) {
              const firstUserMessage = messages.find(m => m.role === 'user');
              if (firstUserMessage && firstUserMessage.parts && Array.isArray(firstUserMessage.parts)) {
                const firstPart = firstUserMessage.parts.find(p => p.type === 'text');
                if (firstPart && 'text' in firstPart && firstPart.text) {
                  title = firstPart.text.substring(0, 40) + (firstPart.text.length > 40 ? '...' : '');
                }
              }
            }
            
            return {
              ...session,
              title,
              messages,
              timestamp: Date.now()
            };
          }
          return session;
        });
        setChatSessions(updatedSessions);
        localStorage.setItem('lumenfin_chat_sessions', JSON.stringify(updatedSessions));
        prevMessagesLengthRef.current = messages.length;
      }
    }
  }, [messages, isLoaded, currentChatId]);

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    localStorage.removeItem(`lumenfin_chat_input_${currentChatId}`);

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
  
  const handleNewChat = () => {
    // Check if current chat is already empty and untitled
    const currentSession = chatSessions.find(s => s.id === currentChatId);
    if (currentSession && currentSession.title === 'New Chat' && currentSession.messages.length === 0) {
      // Don't create a new chat if the current one is already empty
      return;
    }
    
    const newChatId = `chat_${Date.now()}`;
    const newSession: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      timestamp: Date.now()
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    localStorage.setItem('lumenfin_chat_sessions', JSON.stringify(updatedSessions));
    onChatIdChange(newChatId);
    setMessages([]);
    prevMessagesLengthRef.current = 0;
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent deleting the last chat
    if (chatSessions.length <= 1) {
      return;
    }
    
    const updatedSessions = chatSessions.filter(s => s.id !== chatId);
    setChatSessions(updatedSessions);
    localStorage.setItem('lumenfin_chat_sessions', JSON.stringify(updatedSessions));
    
    // Switch to another chat if we deleted the current one
    if (chatId === currentChatId && updatedSessions.length > 0) {
      onChatIdChange(updatedSessions[0].id);
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
    <div className="flex h-full w-full">
      {/* Chat History Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-[#0f172a]/80 backdrop-blur-xl ${isSidebarOpen ? 'border-r border-[#1e293b]' : ''} transition-all duration-300 flex flex-col overflow-hidden`}>
        {isSidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#1e293b]/50">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-3 bg-[#10b981] hover:bg-[#059669] rounded-lg text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Chat</span>
              </button>
            </div>

            {/* Chat History List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => onChatIdChange(session.id)}
                    className={`group flex items-center gap-2 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                      session.id === currentChatId
                        ? 'bg-[#1e293b] text-white border border-[#10b981]/30'
                        : 'text-slate-400 hover:bg-[#1e293b]/50 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-sm truncate">{session.title}</span>
                    <button
                      onClick={(e) => handleDeleteChat(session.id, e)}
                      disabled={chatSessions.length <= 1}
                      className={`opacity-0 group-hover:opacity-100 p-1.5 rounded transition-all flex-shrink-0 ${
                        chatSessions.length <= 1 
                          ? 'cursor-not-allowed opacity-30 hover:bg-transparent' 
                          : 'hover:bg-red-500/20'
                      }`}
                      aria-label={`Delete ${session.title}`}
                      title={chatSessions.length <= 1 ? 'Cannot delete the last chat' : 'Delete chat'}
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${
                        chatSessions.length <= 1 ? 'text-slate-600' : 'text-red-400'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="h-full w-full flex flex-col">
          <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl h-full border border-[#1e293b] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-[#1e293b]/50">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-[#1e293b]/50 rounded-lg transition-colors text-slate-400 hover:text-white mr-4"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
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
                // Extract text content from parts with proper null/undefined handling
                const content = (message.parts && Array.isArray(message.parts))
                  ? message.parts
                      .filter(part => part && part.type === 'text')
                      .map(part => (part as any).text || '')
                      .join('')
                  : ''; // Fallback if parts is undefined or not an array

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
    </div>
  );
}
