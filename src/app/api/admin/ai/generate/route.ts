import { NextResponse } from 'next/server';
import { generateText, isGeminiConfigured } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, category, destination } = body;

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY.' },
        { status: 400 }
      );
    }

    let prompt = '';

    if (type === 'hook') {
      prompt = `Write a catchy 3-second hook (max 120 characters) for a Bali adventure product.
Title: ${title}
Category: ${category}
${destination ? `Destination: ${destination}\n` : ''}
The hook should be emotional, exciting, and make the reader want to book immediately.
Reply with ONLY the hook text, no quotes, no extra explanation.`;
    } else if (type === 'shortDescription') {
      prompt = `Write a short product description (max 200 characters) for a Bali adventure.
Title: ${title}
Category: ${category}
${destination ? `Destination: ${destination}\n` : ''}
The description should be compelling for search results and social sharing.
Reply with ONLY the description text.`;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }

    const result = await generateText(prompt, { temperature: 0.7, maxOutputTokens: 256 });

    if (!result) {
      return NextResponse.json({ success: false, error: 'AI generation failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.trim() });
  } catch (error) {
    console.error('AI Generate API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
