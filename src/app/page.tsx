import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-hidden relative">
      {/* Enhanced Background Glow Effects */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-900/20 rounded-full blur-[150px] animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[120px]"></div>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Logo Badge */}
          <div className="mb-8 inline-flex items-center gap-2 px-4 py-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-full">
            <span className="text-2xl">📊</span>
            <span className="text-sm font-bold tracking-tight">
              Lumen<span className="text-[#10b981]">Fin</span>
            </span>
            <span className="text-xs text-slate-500 ml-2">v1.0</span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              LumenFin:
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#10b981] via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Grounded Financial
            </span>
            <br />
            <span className="text-white">Intelligence</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            High-speed RAG analysis for complex financial documents.
          </p>
          <p className="text-slate-500 text-lg mb-12">
            Powered by <span className="text-[#10b981] font-semibold">Cerebras</span> & <span className="text-[#10b981] font-semibold">MongoDB</span>
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <SignedIn>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-slate-950 font-bold py-6 px-12 rounded-xl text-lg transition-all shadow-2xl shadow-[#10b981]/30 hover:shadow-[#10b981]/50 hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-slate-950 font-bold py-6 px-12 rounded-xl text-lg transition-all shadow-2xl shadow-[#10b981]/30 hover:shadow-[#10b981]/50 hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedOut>

            <button className="text-slate-400 hover:text-white transition-all flex items-center gap-2 py-6 px-8 border border-slate-700 rounded-xl hover:border-slate-600 hover:bg-slate-900/30 group">
              <Play className="w-4 h-4 group-hover:scale-110 transition-transform" fill="currentColor" />
              <span className="font-medium">Watch Demo</span>
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <Zap className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm text-slate-400">Sub-second inference</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <Shield className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm text-slate-400">Enterprise security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full backdrop-blur-sm">
              <BarChart3 className="w-4 h-4 text-[#10b981]" />
              <span className="text-sm text-slate-400">Source citations</span>
            </div>
          </div>
        </div>
      </main>

      {/* Decorative sparkle */}
      <div className="absolute bottom-16 right-16 text-8xl text-slate-800/20 rotate-12 animate-pulse">✦</div>
    </div>
  );
}
