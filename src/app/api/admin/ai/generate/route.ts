import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText, isGeminiConfigured } from '@/lib/gemini';
import { requireAdminRole } from '@/lib/adminGuard';

const generateSchema = z.object({
  type: z.enum(['hook', 'shortDescription']),
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  destination: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdminRole('EDITOR');
  } catch (e) {
    const res = e as NextResponse;
    return res;
  }

  try {
    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { type, title, category, destination } = parsed.data;

    if (!isGeminiConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Gemini is not configured. Set GEMINI_API_KEY.' },
        { status: 400 },
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
