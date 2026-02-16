import connectDB from './mongodb';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

interface SearchResult {
  content: string;
  metadata: {
    fileName: string;
    pageNumber: number;
    uploadedAt: Date;
    userId: string;
  };
  score: number;
}

/**
 * Search financial chunks using MongoDB Atlas Vector Search
 * @param query - The search query string
 * @param userId - User ID to filter results (optional)
 * @param topK - Number of top results to return (default: 25)
 * @returns Array of relevant chunks with metadata and similarity scores
 */
export async function searchFinancialChunks(
  query: string,
  userId?: string,
  topK: number = 25
): Promise<SearchResult[]> {
  try {
    // Debug logging at the top of the function
    console.log('Vector Search Query:', { userId, queryText: query.substring(0, 100) });

    // Validate environment variables
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not configured');
    }

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    // Validate query before processing
    if (!query || typeof query !== 'string') {
      console.warn('⚠️ Invalid query passed to searchFinancialChunks:', query);
      return [];
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      console.warn('⚠️ Empty query after trimming');
      return [];
    }

    // Generate embedding using standard LangChain with 3072 dimensions (matches MongoDB)
    // CRITICAL: No outputDimensionality parameter - defaults to native 3072
    const embeddings = new GoogleGenerativeAIEmbeddings({
      model: "models/gemini-embedding-001",
    });
    console.log(`🔍 Generating embedding for query: \"${trimmedQuery.substring(0, 50)}${trimmedQuery.length > 50 ? '...' : ''}\"`);

    let queryEmbedding: number[];
    try {
      queryEmbedding = await embeddings.embedQuery(trimmedQuery);
      console.log(`✅ Embedding generated successfully (dimension: ${queryEmbedding.length})`);
      
      // Verify dimensions are correct (should be 3072, not 768)
      if (queryEmbedding.length !== 3072) {
        console.warn(`⚠️ Warning: Expected 3072 dimensions, but got ${queryEmbedding.length}`);
      }
    } catch (embeddingError: any) {
      console.error('❌ Failed to generate query embedding:', embeddingError);

      if (embeddingError.message?.includes('429') || embeddingError.message?.includes('rate limit')) {
        throw new Error('Google API rate limit exceeded. Please try again in a moment.');
      }

      if (embeddingError.message?.includes('API key')) {
        throw new Error('Invalid or expired Google API key.');
      }

      throw new Error(`Embedding generation failed: ${embeddingError.message || 'Unknown error'}`);
    }

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    const { db } = await connectDB();
    const collection = db.collection('financial_chunks');

    // Verify collection has documents
    const docCount = await collection.countDocuments();
    console.log(`📚 Collection has ${docCount} documents`);

    if (docCount === 0) {
      console.warn('⚠️ No documents in financial_chunks collection');
      return [];
    }

    // Build aggregation pipeline for vector search
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index', // Name of your Atlas Vector Search index
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 250, // INCREASED: Cast wider net for better retrieval
          limit: topK, // INCREASED default to 25 for richer context
        },
      },
      {
        $project: {
          content: 1,
          metadata: 1,
          score: { $meta: 'vectorSearchScore' },
        },
      },
    ];

    // Add user filter if provided (matches userId format from ingest/route.ts)
    if (userId) {
      pipeline.splice(1, 0, {
        $match: { 'metadata.userId': userId },
      });
      console.log(`🔒 Filtering results for userId: ${userId}`);
    }

    // Execute vector search
    console.log('🔎 Executing vector search...');
    const results = await collection.aggregate(pipeline).toArray();
    console.log(`✅ Found ${results.length} relevant chunks (out of ${docCount} total documents)`);

    if (results.length > 0) {
      console.log(`📊 Top result score: ${results[0].score?.toFixed(4) || 'N/A'}`);
      console.log(`📄 Top result preview: ${results[0].content?.substring(0, 100)}...`);
    }

    return results.map((doc) => ({
      content: doc.content,
      metadata: doc.metadata,
      score: doc.score || 0,
    }));

  } catch (error) {
    console.error('❌ Vector Search Error:', error);

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('index') || errorMessage.includes('$vectorSearch')) {
      throw new Error(
        'Vector search index not configured. Please create a vector search index named "vector_index" ' +
        'on the "embedding" field in MongoDB Atlas.'
      );
    }

    if (errorMessage.includes('MONGODB_URI')) {
      throw new Error('Database configuration missing');
    }

    if (errorMessage.includes('rate limit')) {
      throw new Error(errorMessage); // Already formatted
    }

    throw new Error(`Failed to search financial chunks: ${errorMessage}`);
  }
}

/**
 * Legacy function for backward compatibility
 */
export const searchVectorStore = async (query: string) => {
  return searchFinancialChunks(query);
};
