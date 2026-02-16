'use client';

import React from 'react';
import DocumentVault from '@/components/dashboard/DocumentVault';
import FinancialAnalysisChat from '@/components/dashboard/FinancialAnalysisChat';
import { Zap } from 'lucide-react';

export default function DashboardPage() {
  const [currentChatId, setCurrentChatId] = React.useState<string>('default');

  return (
    <div className="h-full bg-[#020617] flex flex-col">
      {/* Enhanced Header */}
      <header className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-200 mb-1">Financial Analysis Dashboard</h1>
            <p className="text-sm text-slate-400">Upload documents and analyze financial data with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 rounded-xl border border-[#10b981]/30">
            <Zap className="w-4 h-4 text-[#10b981]" />
            <span className="text-sm font-medium text-[#10b981]">Cerebras AI</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout with calc() for proper height */}
      <main className="flex-1 flex overflow-hidden" style={{height: 'calc(100vh - 89px)'}}>
        {/* Left Panel: Document Vault (30%) */}
        <div className="w-[30%] border-r border-slate-800 p-6 overflow-hidden">
          <DocumentVault />
        </div>
        
        {/* Right Panel: Chat Interface (70%) */}
        <div className="flex-1 p-6 overflow-hidden">
          <FinancialAnalysisChat 
            key={currentChatId}
            currentChatId={currentChatId} 
            onChatIdChange={setCurrentChatId} 
          />
        </div>
      </main>
    </div>
  );
}
