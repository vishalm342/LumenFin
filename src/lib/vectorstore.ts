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
 * @param topK - Number of top results to return (default: 4)
 * @returns Array of relevant chunks with metadata and similarity scores
 */
export async function searchFinancialChunks(
  query: string,
  userId?: string,
  topK: number = 4
): Promise<SearchResult[]> {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    // Validate query before processing
    if (!query || typeof query !== 'string') {
      console.warn('Invalid query passed to searchFinancialChunks:', query);
      return [];
    }
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      console.warn('Empty query after trimming');
      return [];
    }

    // Generate embedding for the query
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: 'text-embedding-004',
    });

    console.log('Generating embedding for query:', trimmedQuery.substring(0, 50));
    const queryEmbedding = await embeddings.embedQuery(trimmedQuery);

    // Connect to MongoDB
    const { db } = await connectDB();
    const collection = db.collection('financial_chunks');

    // Build aggregation pipeline for vector search
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: 'vector_index', // Name of your Atlas Vector Search index
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: topK,
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

    // Add user filter if provided
    if (userId) {
      pipeline.splice(1, 0, {
        $match: { 'metadata.userId': userId },
      });
    }

    // Execute vector search
    const results = await collection.aggregate(pipeline).toArray();

    return results.map((doc) => ({
      content: doc.content,
      metadata: doc.metadata,
      score: doc.score,
    }));

  } catch (error) {
    console.error('Vector Search Error:', error);
    throw new Error(`Failed to search financial chunks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Legacy function for backward compatibility
 */
export const searchVectorStore = async (query: string) => {
  return searchFinancialChunks(query);
};
