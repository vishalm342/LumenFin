import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectDB();
    const collection = db.collection('financial_chunks');

    // Aggregate to find unique documents for this user
    const documents = await collection.aggregate([
      {
        $match: {
          'metadata.userId': userId
        }
      },
      {
        $group: {
          _id: '$metadata.fileName',
          chunkCount: { $sum: 1 },
          uploadedAt: { $max: '$metadata.uploadedAt' }
        }
      },
      {
        $project: {
          fileName: '$_id',
          chunkCount: 1,
          uploadedAt: 1,
          _id: 0
        }
      },
      {
        $sort: { uploadedAt: -1 }
      }
    ]).toArray();

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check for ?reset=true query parameter
    const url = new URL(req.url);
    const resetParam = url.searchParams.get('reset') === 'true';

    // Parse body for deleteAll flag
    let deleteAll = false;
    let fileName = '';

    try {
      const body = await req.json();
      deleteAll = body.deleteAll || false;
      fileName = body.fileName || '';
    } catch {
      // Body parsing failed, that's okay if using query params
    }

    const { db } = await connectDB();
    const collection = db.collection('financial_chunks');

    // Reset entire vault if deleteAll flag is set OR ?reset=true
    // Important: Only delete this user's documents, not the entire collection
    if (deleteAll || resetParam) {
      const result = await collection.deleteMany({ 'metadata.userId': userId });
      console.log(`🗑️ Reset vault for user ${userId}: deleted ${result.deletedCount} chunks`);
      return NextResponse.json({
        success: true,
        message: 'Vault reset successfully',
        deletedCount: result.deletedCount
      });
    }

    // Otherwise delete specific file (user-scoped)
    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    const result = await collection.deleteMany({
      'metadata.fileName': fileName,
      'metadata.userId': userId
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
