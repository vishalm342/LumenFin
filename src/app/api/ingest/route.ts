import { NextResponse } from 'next/server';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.GOOGLE_API_KEY || !process.env.MONGODB_URI) throw new Error('Missing env vars');

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: "No file found" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    // Convert Buffer to Blob for WebPDFLoader
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });

    // @ts-ignore - WebPDFLoader types might need adjustment in some envs
    const loader = new WebPDFLoader(blob, {
      // Optional: you can pass parameters here if needed
    });

    const rawDocs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splits = await textSplitter.splitDocuments(rawDocs);

    // CRITICAL: Preserve metadata and ensure userId is attached
    const docs = splits.map(chunk => ({
      pageContent: chunk.pageContent,
      metadata: {
        ...chunk.metadata,
        userId: userId,
        fileName: file.name,
        uploadedAt: new Date(),
        // WebPDFLoader usually puts page number in loc.pageNumber (1-indexed)
        pageNumber: chunk.metadata.loc?.pageNumber || 1
      }
    }));

    try {
      // Standard LangChain embeddings with 3072 dimensions (matches MongoDB)
      const embeddings = new GoogleGenerativeAIEmbeddings({
        model: "models/gemini-embedding-001",
        taskType: "RETRIEVAL_DOCUMENT" as any, // For document embedding
      });

      const { db } = await connectDB();
      const collection = db.collection('financial_chunks');

      // ⚡ OPTIMIZED BATCHING
      // Google GenAI supports batch embedding. We can send multiple texts in one go.
      // Batch size of 50 is a safe sweet spot for performant ingestion without hitting payload limits.
      const batchSize = 50;

      console.log(`🚀 Starting optimized batch processing: ${docs.length} chunks in batches of ${batchSize}`);

      let totalProcessed = 0;

      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const batchTexts = batch.map(d => d.pageContent);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(docs.length / batchSize);

        console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

        try {
          // Generate embeddings in a single batch call (Much faster than 1-by-1)
          const batchEmbeddings = await embeddings.embedDocuments(batchTexts);

          // Prepare vectors for insertion
          const batchVectors = batch.map((doc, idx) => ({
            content: doc.pageContent,
            embedding: batchEmbeddings[idx],
            metadata: doc.metadata,
          }));

          // Insert batch to MongoDB
          await collection.insertMany(batchVectors);
          totalProcessed += batchVectors.length;

          console.log(`💾 Inserted batch ${batchNumber}/${totalBatches}`);

        } catch (batchError: any) {
          console.error(`❌ Batch ${batchNumber} failed:`, batchError);
          // If a batch fails, we might want to try individual or just throw
          throw batchError;
        }
      }

      console.log(`✅ Successfully processed and inserted ${totalProcessed} chunks into database`);

    } catch (embeddingError) {
      console.error("❌ Embedding generation failed:", embeddingError);
      throw embeddingError;
    }

    return NextResponse.json({ success: true, chunks: docs.length });

  } catch (error: any) {
    console.error("Ingestion failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
