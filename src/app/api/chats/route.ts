import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all chats for the authenticated user
        // sorted by isPinned (descending) then createdAt (descending)
        const chats = await Chat.find({ userId })
            .sort({ isPinned: -1, createdAt: -1 })
            .lean();

        return NextResponse.json({ chats });

    } catch (error) {
        console.error('Failed to fetch chats:', error);
        return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const body = await req.json();
        const { title = 'New Chat', messages = [] } = body;

        const chat = await Chat.create({
            userId,
            title,
            messages,
            isPinned: false
        });

        return NextResponse.json({ chat }, { status: 201 });

    } catch (error) {
        console.error('Failed to create chat:', error);
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }
}
