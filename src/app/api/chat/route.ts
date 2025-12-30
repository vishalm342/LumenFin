import { createCerebras } from '@ai-sdk/cerebras';
import { streamText } from 'ai';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';

const cerebras = createCerebras({
  apiKey: process.env.CEREBRAS_API_KEY!,
});

// Simple function to generate embeddings for the query
// In production, you'd want to use the same embedding model as during ingestion
async function generateQueryEmbedding(query: string): Promise<number[]> {
  // For now, we'll use a simple approach - in production, use OpenAI embeddings or similar
  // This is a placeholder that creates a dummy embedding
  // TODO: Replace with actual embedding generation using the same model as ingestion
  const words = query.toLowerCase().split(' ');
  const embedding = new Array(1536).fill(0);
  
  // Simple hash-based approach for demo
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1)) % 1536;
      embedding[idx] += 0.1;
    }
  }
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!messages || messages.length === 0) {
      return new Response('Messages are required', { status: 400 });
    }

    // Get the latest user message for RAG retrieval
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Connect to MongoDB
    await connectDB();

    // Step 1: Convert query to embedding
    const queryEmbedding = await generateQueryEmbedding(userQuery);

    // Step 2: Search MongoDB for similar chunks using vector search
    // Note: This requires MongoDB Atlas with a vector search index configured
    // For basic similarity, we'll use cosine similarity in-memory
    const allDocuments = await Document.find({}).limit(100).lean();
    
    // Calculate cosine similarity for each document
    const documentsWithScores = allDocuments.map((doc: any) => {
      const docEmbedding = doc.embedding;
      
      // Cosine similarity
      let dotProduct = 0;
      let docMagnitude = 0;
      let queryMagnitude = 0;
      
      for (let i = 0; i < Math.min(docEmbedding.length, queryEmbedding.length); i++) {
        dotProduct += docEmbedding[i] * queryEmbedding[i];
        docMagnitude += docEmbedding[i] * docEmbedding[i];
        queryMagnitude += queryEmbedding[i] * queryEmbedding[i];
      }
      
      const similarity = dotProduct / (Math.sqrt(docMagnitude) * Math.sqrt(queryMagnitude));
      
      return {
        content: doc.content,
        metadata: doc.metadata,
        similarity,
      };
    });

    // Sort by similarity and take top 5 chunks
    const topChunks = documentsWithScores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // Step 3: Format context for the LLM
    const context = topChunks.length > 0
      ? topChunks.map((chunk, idx) => `[Document ${idx + 1}]\n${chunk.content}`).join('\n\n')
      : 'No relevant documents found.';

    // Step 4: Create system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a financial analysis assistant. Use the following context from uploaded documents to answer the user's question. If the context doesn't contain relevant information, say so.

Context:
${context}

Instructions:
- Provide clear, concise financial analysis
- Cite specific information from the context when possible
- If the context doesn't contain the answer, acknowledge that
- Format numbers and financial data clearly`,
    };

    // Step 5: Stream response from Cerebras using llama-3.3-70b
    const result = streamText({
      model: cerebras('llama-3.3-70b'),
      messages: [systemMessage, ...messages],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
