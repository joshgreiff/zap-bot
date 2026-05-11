import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import store from '@/lib/memory-store';

/** Public base URL for links (check-in, admin, wheel). Prefer env for a fixed custom domain. */
function getPublicBaseUrl(request: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0].trim();
    return `${forwardedProto}://${host}`;
  }

  return request.nextUrl.origin;
}

export async function GET() {
  try {
    const streams = (await store.getAllStreams()).filter((s) => s.is_active);
    return NextResponse.json(streams);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const streamId = uuidv4();
    
    console.log(`Creating stream: ${streamId} with name: ${name}`);
    
    const stream = await store.createStream(streamId, name);
    console.log('Stream created successfully:', stream);
    
    const baseUrl = getPublicBaseUrl(request);
    const adminToken = encodeURIComponent(stream.admin_token);
    
    return NextResponse.json({
      streamId,
      name,
      checkInUrl: `${baseUrl}/checkin/${streamId}`,
      adminUrl: `${baseUrl}/admin/${streamId}?token=${adminToken}`,
      wheelUrl: `${baseUrl}/wheel/${streamId}`
    });
  } catch (error: unknown) {
    console.error('Error creating stream:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
