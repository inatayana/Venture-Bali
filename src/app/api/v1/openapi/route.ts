import { openApiSpec, getOpenApiSpecYaml } from '@/lib/api/openapi';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json';
  
  if (format === 'yaml') {
    const yaml = await getOpenApiSpecYaml();
    return new NextResponse(yaml, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
  
  return NextResponse.json(openApiSpec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}