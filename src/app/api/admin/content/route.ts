import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addInternalLinks,
  generateArticle,
  getLinkableVentures,
  saveArticle,
} from '@/lib/aiContent';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const generateSchema = z.object({
  title: z.string().trim().min(45).max(60),
  primaryKeyword: z.string().trim().min(2).max(80),
  category: z.string().trim().min(1),
  destination: z.string().trim().max(60).optional(),
  ventureSlug: z.string().trim().max(120).optional(),
  language: z.enum(['en', 'id']).default('en'),
  publish: z.boolean().default(false),
});

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        slug: true,
        title: true,
        keywords: true,
        tags: true,
        publishedAt: true,
        aiGenerated: true,
        createdAt: true,
      },
    });

    const ventures = await getLinkableVentures();

    return NextResponse.json({
      success: true,
      data: { articles, ventures },
      error: null,
    });
  } catch (error) {
    console.error('Failed to load articles:', error);
    return NextResponse.json(
      { success: false, error: { code: 'LOAD_FAILED', message: 'Failed to load articles' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = generateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The article request is invalid',
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  const articleRequest = parsed.data;

  const { article, rejection } = await generateArticle(articleRequest);

  if (!article) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'GENERATION_FAILED', message: rejection ?? 'The article could not be generated' },
      },
      { status: 422 }
    );
  }

  // Link to the catalogue automatically.
  const ventures = await getLinkableVentures();
  const content = addInternalLinks(article.content, ventures);

  const target = articleRequest.ventureSlug
    ? await prisma.venture.findUnique({
        where: { slug: articleRequest.ventureSlug },
        select: { id: true },
      })
    : null;

  const saved = await saveArticle(
    { ...article, content },
    { publish: articleRequest.publish, ventureId: target?.id }
  );

  return NextResponse.json({
    success: true,
    data: {
      id: saved.id,
      slug: saved.slug,
      title: article.title,
      metaDescription: article.metaDescription,
      keywords: article.keywords,
      tags: article.tags,
      published: articleRequest.publish,
      contentLength: content.length,
    },
    error: null,
  });
}
