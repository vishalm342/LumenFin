import { createCerebras } from '@ai-sdk/cerebras';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { searchFinancialChunks } from '@/lib/vectorstore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Production diagnostics (do not log secrets)
console.log('DB_URI_LOADED', Boolean(process.env.MONGODB_URI));

// Initialize Cerebras with explicit key check
const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Validate required environment variables
    if (!process.env.CEREBRAS_API_KEY) {
      throw new Error('CEREBRAS_API_KEY is not set');
    }
    if (!process.env.CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not set');
    }
    
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const { messages } = await req.json();
    if (!messages?.length) return new Response('No messages', { status: 400 });

    const lastMessage = messages[messages.length - 1];
    console.log('Last message structure:', JSON.stringify(lastMessage, null, 2));
    
    // Extract user query with comprehensive handling
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
    console.log('Extracted user query:', userQuery);
    
    if (!userQuery) {
      return new Response(
        JSON.stringify({ error: 'No valid query text found in message' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: MongoDB Atlas Vector Search retrieval
    const relevantChunks = await searchFinancialChunks(userQuery, userId, 4);

    // Step 2: Context Preparation with Citation Metadata
    const context = relevantChunks.length > 0 
      ? relevantChunks.map((chunk, idx) => 
          `[Source ${idx + 1}: ${chunk.metadata.fileName}, Page ${chunk.metadata.pageNumber}]\n${chunk.content}`
        ).join('\n\n')
      : "No relevant documents found.";

    // Step 3: Strict System Instruction
    const systemPrompt = `You are a Precise Financial Analyst. 
    CONTEXT: ${context}
    RULES: Answer ONLY using the context. Cite sources like [Source X: file.pdf, Page Y]. 
    If not in context, say you don't have enough info. Be precise with metrics.`;

    // Step 4: Sub-second inference with Llama-3.3-70b
    const result = await streamText({
      model: cerebras('llama-3.3-70b'),
      system: systemPrompt, // Correct way to pass system prompt in v4
      messages,
      temperature: 0.1, // Near-zero for extreme financial accuracy
    });

    // IMPORTANT: Return the stream response
    // Using toTextStreamResponse() as toDataStreamResponse() is not recognized by the current type definitions
    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Inference failed: ${errorMessage}` }), { status: 500 });
  }
}