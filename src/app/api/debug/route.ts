import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy init

        // Fetch list of models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);
        const data = await response.json();

        // Filter for embedding models
        const embeddingModels = data.models?.filter((m: any) => m.name.includes('embedding')) || [];

        return NextResponse.json({
            available_models: embeddingModels.map((m: any) => m.name),
            full_response: data
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
