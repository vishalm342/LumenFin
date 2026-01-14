// 

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// REQUIRED: Use require for legacy CommonJS pdf-parse in Next.js 16/Turbopack
// Replace Line 10 with this:
const pdf = (buffer: Buffer) => {
  const parse = require('pdf-parse/lib/pdf-parse.js');
  return parse(buffer);
};

// Professional configurations for heavy PDF processing
export const maxDuration = 60; 
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Production diagnostics (do not log secrets)
console.log('DB_URI_LOADED', Boolean(process.env.MONGODB_URI));
console.log('GEMINI_KEY_LOADED', Boolean(process.env.GOOGLE_API_KEY));

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const allowPublicIngest =
      process.env.LUMENFIN_PUBLIC_INGEST === 'true' ||
      process.env.ALLOW_PUBLIC_INGEST === 'true';

    if (!userId && !allowPublicIngest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveUserId = userId ?? 'public';

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    // Step 1: Buffer Conversion
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 2: Extraction
    const pdfData = await pdf(buffer); // Fixed case-sensitivity
    const extractedText = pdfData.text;

    // Step 3: Chunking (Recursive splitting preserves financial context)
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.createDocuments([extractedText]);

    // Step 4: Embeddings (Gemini 768-dimension resolution)
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { error: 'Missing GOOGLE_API_KEY on server' },
        { status: 500 }
      );
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY!,
      modelName: 'text-embedding-004',
    });

    // Debug logging for Vercel deployment tracking
    console.log('Connecting to DB...');
    const { db } = await connectDB();
    console.log('DB connection successful');
    const collection = db.collection('financial_chunks');

    // Step 5: Batch Processing
    const documents = await Promise.all(chunks.map(async (chunk, i) => {
      const embedding = await embeddings.embedQuery(chunk.pageContent);
      return {
        content: chunk.pageContent,
        embedding: embedding,
        metadata: {
          fileName: file.name,
          pageNumber: i + 1,
          uploadedAt: new Date(),
          userId: effectiveUserId,
        },
      };
    }));

    await collection.insertMany(documents);

    return NextResponse.json({ success: true, message: `Indexed ${chunks.length} chunks.` });

  } catch (error) {
    // Enhanced error logging for Vercel debugging
    console.error('Ingestion Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json({ 
      error: 'Failed to process PDF', 
      details: errorMessage 
    }, { status: 500 });
  }
}

