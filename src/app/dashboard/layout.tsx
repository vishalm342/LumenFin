'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, MessageSquare, Sparkles, Menu, X, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lumenfin_sidebar_open');
    if (saved !== null) {
      setIsSidebarOpen(saved === 'true');
    }
    setIsLoaded(true);
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lumenfin_sidebar_open', isSidebarOpen.toString());
    }
  }, [isSidebarOpen, isLoaded]);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="flex h-screen bg-[#020617] overflow-hidden relative">
      <Toaster position="top-right" theme="dark" />
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'
        } bg-slate-900/50 backdrop-blur-xl border-r border-[#1e293b] flex flex-col transition-all duration-300 ease-in-out absolute md:relative z-40 h-full`}
      >
        {/* Logo & Toggle */}
        <div className="p-6 border-b border-[#1e293b]/50 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="text-2xl transition-transform group-hover:scale-110">📊</div>
            <span className="text-xl font-bold tracking-tight text-white">
              Lumen<span className="text-[#10b981]">Fin</span>
            </span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-white md:flex hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
           <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-white md:hidden flex"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group ${
                  isActive('/dashboard')
                    ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                    : 'text-slate-400 hover:bg-[#1e293b]/50 hover:text-white border border-transparent'
                }`}
              >
                {isActive('/dashboard') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#10b981] rounded-r"></div>
                )}
                <LayoutDashboard className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/documents"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group ${
                  isActive('/dashboard/documents')
                    ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                    : 'text-slate-400 hover:bg-[#1e293b]/50 hover:text-white border border-transparent'
                }`}
              >
                {isActive('/dashboard/documents') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#10b981] rounded-r"></div>
                )}
                <FileText className="w-5 h-5" />
                <span className="font-medium">Documents</span>
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/chat"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative group ${
                  isActive('/dashboard/chat')
                    ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30'
                    : 'text-slate-400 hover:bg-[#1e293b]/50 hover:text-white border border-transparent'
                }`}
              >
                {isActive('/dashboard/chat') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#10b981] rounded-r"></div>
                )}
                <MessageSquare className="w-5 h-5" />
                <span className="font-medium">Chat</span>
              </Link>
            </li>
          </ul>

          {/* Feature Highlight */}
          <div className="mt-8 p-4 bg-gradient-to-br from-[#10b981]/10 to-purple-500/10 rounded-lg border border-[#10b981]/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#10b981]" />
              <span className="text-xs font-semibold text-[#10b981]">AI-Powered</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload PDFs and get instant AI analysis with Cerebras inference.
            </p>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[#1e293b]/50">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0f172a] rounded-lg border border-[#1e293b]">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white block truncate">My Account</span>
              <span className="text-xs text-slate-500">Manage settings</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
         {/* Toggle Button when sidebar is closed */}
         {!isSidebarOpen && (
            <div className="absolute top-4 left-4 z-50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="text-slate-400 hover:text-white bg-slate-900/50 backdrop-blur border border-slate-800"
                >
                    <Menu className="h-6 w-6" />
                </Button>
            </div>
         )}
        {children}
      </main>
    </div>
  );
}
