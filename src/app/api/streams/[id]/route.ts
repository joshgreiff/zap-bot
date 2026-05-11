import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.nextUrl.searchParams.get('token');
    console.log(`Looking for stream: ${id}`);
    
    // Always ensure stream exists for serverless resilience
    const stream = await store.ensureStreamExists(id);
    console.log('Stream ensured:', stream);
    
    const isAdminRequest = adminToken !== null;
    const isAdmin = isAdminRequest && await store.validateAdminToken(id, adminToken);

    if (isAdminRequest && !isAdmin) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }

    const participants = await store.getParticipants(id);
    console.log(`Found ${participants.length} participants`);
    
    return NextResponse.json({
      ...stream,
      participants: isAdmin
        ? participants
        : participants.map(({ id, name, checked_in_at }) => ({ id, name, checked_in_at })),
      stats: await store.getStreamStats(id)
    });
  } catch (error: unknown) {
    console.error('Error getting stream:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.nextUrl.searchParams.get('token');
    const stream = await store.getStream(id);
    
    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    if (!(await store.validateAdminToken(id, adminToken))) {
      return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
    }
    
    // Mark stream as inactive
    await store.endStream(id);
    console.log(`Stream ${id} ended`);
    
    return NextResponse.json({ message: 'Stream ended successfully' });
  } catch (error: unknown) {
    console.error('Error ending stream:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
