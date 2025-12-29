import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // User Query -> Retrieval -> AI Answer logic will go here
  return NextResponse.json({ message: 'Chat API endpoint' });
}
