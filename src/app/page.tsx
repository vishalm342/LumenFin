import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight, Zap, Shield, BarChart3, FileText, Database, Cpu, Lock, Layers, GitBranch } from 'lucide-react';

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

      {/* Architecture Section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-200">
              Technical Architecture
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Enterprise-grade RAG pipeline built with cutting-edge AI infrastructure
            </p>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: PDF Parsing & Chunking */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all group">
              <div className="flex items-center justify-center w-16 h-16 bg-[#10b981]/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-[#10b981]" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-slate-200">01</span>
                <h3 className="text-xl font-bold text-slate-200">PDF Parsing</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Documents are parsed using <span className="text-[#10b981] font-semibold">pdf-parse</span> and split into semantic chunks with LangChain's RecursiveCharacterTextSplitter.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">1000 char chunks</span>
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">200 overlap</span>
              </div>
            </div>

            {/* Step 2: Google Gemini Vectorization */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all group">
              <div className="flex items-center justify-center w-16 h-16 bg-[#10b981]/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-8 h-8 text-[#10b981]" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-slate-200">02</span>
                <h3 className="text-xl font-bold text-slate-200">Vectorization</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Chunks are embedded using <span className="text-[#10b981] font-semibold">Google Gemini text-embedding-004</span> and stored in MongoDB Atlas with vector search indexes.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">768-dim vectors</span>
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">HNSW index</span>
              </div>
            </div>

            {/* Step 3: Cerebras Inference */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all group">
              <div className="flex items-center justify-center w-16 h-16 bg-[#10b981]/10 rounded-xl mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-8 h-8 text-[#10b981]" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold text-slate-200">03</span>
                <h3 className="text-xl font-bold text-slate-200">Inference</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">
                Retrieved context is fed to <span className="text-[#10b981] font-semibold">Cerebras Llama 3.3 70B</span> for sub-second, grounded financial analysis with source citations.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">&lt;1s response</span>
                <span className="px-2 py-1 bg-slate-800/50 text-xs text-slate-400 rounded-md border border-slate-700">Streaming</span>
              </div>
            </div>
          </div>

          {/* Data Flow Visualization */}
          <div className="mt-12 flex items-center justify-center gap-4 text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono">PDF Upload</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-mono">Chunking</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-mono">Embedding</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-mono">Vector DB</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-mono">LLM Query</span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm font-mono text-[#10b981]">Response</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="relative z-10 py-24 px-4 bg-slate-950/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-200">
              Production-Ready Stack
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built with enterprise frameworks and battle-tested infrastructure
            </p>
          </div>

          {/* Tech Stack Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Next.js 15 */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-lg">
                  <Layers className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Next.js 15</h3>
                  <p className="text-sm text-slate-400">App Router + RSC</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Server-side rendering with React Server Components for optimal performance and SEO.
              </p>
            </div>

            {/* MongoDB Atlas */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-[#10b981]/10 rounded-lg">
                  <Database className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">MongoDB Atlas</h3>
                  <p className="text-sm text-slate-400">Vector Search</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Native vector search with HNSW indexing for blazing-fast semantic retrieval at scale.
              </p>
            </div>

            {/* Clerk Auth */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-lg">
                  <Lock className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Clerk</h3>
                  <p className="text-sm text-slate-400">Authentication</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Enterprise-grade authentication with user isolation and protected API routes.
              </p>
            </div>

            {/* Cerebras AI */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-[#10b981]/10 rounded-lg">
                  <Cpu className="w-6 h-6 text-[#10b981]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Cerebras</h3>
                  <p className="text-sm text-slate-400">Llama 3.3 70B</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Fastest inference on the market with streaming responses for real-time user feedback.
              </p>
            </div>

            {/* LangChain */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-lg">
                  <GitBranch className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">LangChain</h3>
                  <p className="text-sm text-slate-400">RAG Framework</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Industry-standard tooling for document loading, text splitting, and embeddings.
              </p>
            </div>

            {/* Vercel AI SDK */}
            <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-[#10b981]/50 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-lg">
                  <Zap className="w-6 h-6 text-slate-200" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-200">Vercel AI SDK</h3>
                  <p className="text-sm text-slate-400">Streaming</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Seamless streaming integration with React hooks for fluid UX during inference.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <SignedIn>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-slate-950 font-bold py-4 px-10 rounded-xl text-base transition-all shadow-xl shadow-[#10b981]/20 hover:shadow-[#10b981]/40 hover:scale-105">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in">
                <Button className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-slate-950 font-bold py-4 px-10 rounded-xl text-base transition-all shadow-xl shadow-[#10b981]/20 hover:shadow-[#10b981]/40 hover:scale-105">
                  Start Building
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Decorative sparkle */}
      <div className="absolute bottom-16 right-16 text-8xl text-slate-800/20 rotate-12 animate-pulse">✦</div>
    </div>
  );
}
