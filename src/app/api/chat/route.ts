import { createCerebras } from '@ai-sdk/cerebras';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { searchFinancialChunks } from '@/lib/vectorstore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Production diagnostics (do not log secrets)
console.log('✅ MONGODB_URI loaded:', Boolean(process.env.MONGODB_URI));
console.log('✅ CEREBRAS_API_KEY loaded:', Boolean(process.env.CEREBRAS_API_KEY));
console.log('✅ GOOGLE_API_KEY loaded:', Boolean(process.env.GOOGLE_API_KEY));

// Initialize Cerebras with explicit key check
if (!process.env.CEREBRAS_API_KEY) {
  throw new Error('❌ FATAL: CEREBRAS_API_KEY is not configured');
}

const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(req: Request) {
  try {
    // ========================================
    // Phase 1: Validate Environment Variables
    // ========================================
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI is not configured');
      return new Response(
        JSON.stringify({ error: 'Database configuration missing. Please contact support.' }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!process.env.CEREBRAS_API_KEY) {
      console.error('❌ CEREBRAS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service configuration missing. Please contact support.' }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!process.env.GOOGLE_API_KEY) {
      console.error('❌ GOOGLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Document search service configuration missing. Please contact support.' }), 
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Phase 2: Authenticate User
    // ========================================
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in.' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Phase 3: Parse and Validate Request
    // ========================================
    let messages;
    try {
      const body = await req.json();
      messages = body.messages;
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request format. Expected JSON with messages array.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!messages?.length) {
      return new Response(
        JSON.stringify({ error: 'No messages provided in request.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Phase 4: Extract User Query
    // ========================================
    const lastMessage = messages[messages.length - 1];
    console.log('📨 Last message structure:', JSON.stringify(lastMessage, null, 2));
    
    let userQuery = '';
    
    if (typeof lastMessage.content === 'string') {
      userQuery = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      // Handle array of parts (multimodal messages)
      userQuery = lastMessage.content
        .filter((part: any) => part.type === 'text' || part.text)
        .map((part: any) => part.text || part.content || '')
        .join(' ');
    } else if (lastMessage.content && typeof lastMessage.content === 'object') {
      // Handle object with text property
      userQuery = (lastMessage.content as any).text || '';
    }
    
    userQuery = userQuery.trim();
    console.log(`🔍 Extracted user query: "${userQuery.substring(0, 100)}${userQuery.length > 100 ? '...' : ''}"`);
    
    if (!userQuery) {
      return new Response(
        JSON.stringify({ error: 'No valid query text found in message. Please provide a text question.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Phase 5: MongoDB Atlas Vector Search
    // ========================================
    console.log(`🔎 Searching financial documents for user: ${userId}`);
    let relevantChunks;
    try {
      relevantChunks = await searchFinancialChunks(userQuery, userId, 4);
      console.log(`✅ Retrieved ${relevantChunks.length} relevant document chunks`);
    } catch (searchError: any) {
      console.error('❌ Vector search failed:', searchError);
      
      const errorMsg = searchError.message || 'Unknown error';
      
      if (errorMsg.includes('rate limit')) {
        return new Response(
          JSON.stringify({ error: 'Search service temporarily unavailable due to rate limits. Please try again shortly.' }), 
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorMsg.includes('index')) {
        return new Response(
          JSON.stringify({ error: 'Document search is not configured properly. Please contact support.' }), 
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to search documents: ${errorMsg}` }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ========================================
    // Phase 6: Prepare Context with Citations
    // ========================================
    const context = relevantChunks.length > 0 
      ? relevantChunks.map((chunk, idx) => 
          `[Source ${idx + 1}: ${chunk.metadata.fileName}, Page ${chunk.metadata.pageNumber}]\n${chunk.content}`
        ).join('\n\n')
      : "No relevant documents found in your vault.";

    console.log(`📄 Context prepared: ${context.length} characters from ${relevantChunks.length} sources`);

    // ========================================
    // Phase 7: Build System Prompt
    // ========================================
    const systemPrompt = `You are a Precise Financial Analyst for LumenFin.

CONTEXT FROM USER'S DOCUMENTS:
${context}

CRITICAL RULES:
1. Answer ONLY using the provided context above
2. Always cite your sources using the format: [Source X: filename, Page Y]
3. If the answer is not in the context, clearly state: "I don't have enough information in your uploaded documents to answer this question."
4. Be precise with numbers, dates, and financial metrics
5. Do not make assumptions or provide external information
6. If calculations are needed, show your work step-by-step

Remember: You can only reference information from the documents in the context above.`;

    // ========================================
    // Phase 8: Stream Cerebras Llama-3.3-70b Response
    // ========================================
    console.log('🚀 Initiating Cerebras Llama-3.3-70b inference...');
    
    try {
      const result = await streamText({
        model: cerebras('llama-3.3-70b'),
        system: systemPrompt,
        messages,
        temperature: 0.1, // Near-zero for financial accuracy
      });

      console.log('✅ Stream initiated successfully');
      
      // Return streaming response using the correct method
      return result.toTextStreamResponse();
      
    } catch (streamError: any) {
      console.error('❌ Cerebras streaming failed:', streamError);
      
      const errorMsg = streamError.message || 'Unknown error';
      
      if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        return new Response(
          JSON.stringify({ error: 'AI service is experiencing high demand. Please try again in a moment.' }), 
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (errorMsg.includes('API key') || errorMsg.includes('unauthorized')) {
        return new Response(
          JSON.stringify({ error: 'AI service authentication failed. Please contact support.' }), 
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `AI inference failed: ${errorMsg}` }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    // ========================================
    // Global Error Handler
    // ========================================
    console.error('❌ Chat API Fatal Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    // ALWAYS return JSON, never HTML error pages
    return new Response(
      JSON.stringify({ 
        error: `Chat service error: ${errorMessage}`,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}