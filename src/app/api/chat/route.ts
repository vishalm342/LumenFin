import { createCerebras } from '@ai-sdk/cerebras';
import { streamText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { searchFinancialChunks } from '@/lib/vectorstore';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Cerebras provider
const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY || '',
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    if (!process.env.MONGODB_URI || !process.env.CEREBRAS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Configuration missing.' }), { status: 503 });
    }

    const body = await req.json();
    const { messages, chatId } = body;

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'No messages provided.' }), { status: 400 });
    }

    await connectToDatabase();

    // Persist User Message
    if (chatId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        await Chat.updateOne({ _id: chatId, userId }, {
          $push: { messages: { id: Date.now().toString(), role: 'user', content: lastMessage.content, createdAt: new Date() } }
        });
      }
    }

    // STEP 1: Extract User Query from last message
    const lastMessage = messages[messages.length - 1];
    let userQuery = '';
    if (typeof lastMessage.content === 'string') {
      userQuery = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      userQuery = lastMessage.content.map((p: any) => p.text || '').join(' ');
    } else if (typeof lastMessage.content === 'object') {
      userQuery = (lastMessage.content as any).text || '';
    }
    userQuery = userQuery.trim();

    // STEP 2: Generate Embedding (handled in searchFinancialChunks - defaults to 3072 dimensions)
    console.log('1. Embedding generated');
    
    // STEP 3: Vector Search
    let relevantChunks: any[] = [];
    try {
      relevantChunks = await searchFinancialChunks(userQuery, userId, 25);
      console.log('2. Vector search complete, found:', relevantChunks.length);
    } catch (e) {
      console.error('Vector search failed:', e);
    }

    // STEP 4: Context Formatting with page numbers for citation
    const contextString = relevantChunks
      .map(r => `[Page ${r.metadata.pageNumber || 'Unknown'}]: ${r.content}`)
      .join('\n\n');

    // STEP 5: System Prompt with citation rules
    const systemPrompt = `You are an expert financial analyst. Answer the user's question based ONLY on the following context. You MUST cite your sources using the format [Page X]. If the answer is not in the context, say 'I don't have enough information.'\n\nContext:\n${contextString}`;

    // STEP 6: Streaming & DB Saving
    const result = await streamText({
      model: cerebras('llama3.3-70b'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.1,
      async onFinish({ text }) {
        // Save chat to database asynchronously (non-blocking)
        if (chatId) {
          try {
            await Chat.updateOne(
              { _id: chatId, userId },
              {
                $push: {
                  messages: {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: text,
                    createdAt: new Date(),
                  },
                },
              }
            );
            console.log('3. Chat saved to database successfully');
          } catch (dbError) {
            console.error('Failed to save assistant message:', dbError);
          }
        }
      },
    });

    // STEP 7: Return stream response
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}