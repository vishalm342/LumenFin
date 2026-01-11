'use client';

import React from 'react';
import DocumentVault from '@/components/dashboard/DocumentVault';
import FinancialAnalysisChat from '@/components/dashboard/FinancialAnalysisChat';
import { Zap } from 'lucide-react';

export default function DashboardPage() {
  const [currentChatId, setCurrentChatId] = React.useState<string>('default');

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      {/* Enhanced Header */}
      <header className="px-8 py-5 border-b border-[#1e293b]/50 bg-gradient-to-r from-[#020617] to-[#0f172a] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Financial Analysis Dashboard</h1>
            <p className="text-sm text-slate-400">Upload documents and analyze financial data with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 rounded-lg border border-[#10b981]/30">
            <Zap className="w-4 h-4 text-[#10b981]" />
            <span className="text-sm font-medium text-[#10b981]">Cerebras AI</span>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Document Vault (25%) */}
        <div className="w-1/4 border-r border-[#1e293b] overflow-y-auto">
          <DocumentVault />
        </div>
        
        {/* Right Panel: Chat Interface (75%) */}
        <div className="flex-1 flex overflow-hidden">
          <FinancialAnalysisChat currentChatId={currentChatId} onChatIdChange={setCurrentChatId} />
        </div>
      </main>
    </div>
  );
}
