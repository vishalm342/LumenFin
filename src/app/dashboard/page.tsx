import DocumentVault from '@/components/dashboard/DocumentVault';
import FinancialAnalysisChat from '@/components/dashboard/FinancialAnalysisChat';
import { TrendingUp, FileCheck, Zap } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="h-full bg-[#020617] flex flex-col">
      {/* Enhanced Header */}
      <header className="px-8 py-6 border-b border-[#1e293b]/50 bg-gradient-to-r from-[#020617] to-[#0f172a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Financial Analysis Dashboard</h1>
            <p className="text-sm text-slate-400 leading-relaxed">Upload documents and analyze financial data with AI-powered insights</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 rounded-lg border border-[#10b981]/30">
              <Zap className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm font-medium text-[#10b981]">Cerebras AI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Split View Content - 33% / 66% */}
      <main className="flex-1 p-8 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Left Panel: Document Vault (33%) */}
          <div className="lg:col-span-1 h-full">
            <DocumentVault />
          </div>
          
          {/* Right Panel: Chat Interface (66%) */}
          <div className="lg:col-span-2 h-full">
            <FinancialAnalysisChat />
          </div>
        </div>
      </main>
    </div>
  );
}

