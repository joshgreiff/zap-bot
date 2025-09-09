import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`Looking for stream: ${id}`);
    
    // Always ensure stream exists for serverless resilience
    const stream = store.ensureStreamExists(id);
    console.log('Stream ensured:', stream);
    
    const participants = store.getParticipants(id);
    console.log(`Found ${participants.length} participants`);
    
    return NextResponse.json({
      ...stream,
      participants,
      stats: store.getStreamStats(id)
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
    const stream = store.getStream(id);
    
    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }
    
    // Mark stream as inactive
    stream.is_active = false;
    console.log(`Stream ${id} ended`);
    
    return NextResponse.json({ message: 'Stream ended successfully' });
  } catch (error: unknown) {
    console.error('Error ending stream:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
