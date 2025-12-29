import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // PDF -> Chunks -> Vector DB logic will go here
  return NextResponse.json({ message: 'Ingest API endpoint' });
}
