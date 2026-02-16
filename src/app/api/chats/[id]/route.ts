import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Chat from '@/models/Chat';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        await connectToDatabase();

        const chat = await Chat.findOne({ _id: params.id, userId });

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ chat });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        const { id } = params;
        const body = await req.json();

        await connectToDatabase();

        // Only allow specific updates to avoid overwriting userId or messages inadvertently
        const updateData: any = {};
        if (typeof body.title === 'string') updateData.title = body.title;
        if (typeof body.isPinned === 'boolean') updateData.isPinned = body.isPinned;
        if (Array.isArray(body.messages)) updateData.messages = body.messages;

        const chat = await Chat.findOneAndUpdate(
            { _id: id, userId },
            { $set: updateData },
            { new: true } // Return updated doc
        );

        if (!chat) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ chat });

    } catch (error) {
        console.error('Failed to update chat:', error);
        return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await props.params;
        await connectToDatabase();

        const result = await Chat.deleteOne({ _id: params.id, userId });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to delete chat:', error);
        return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }
}
