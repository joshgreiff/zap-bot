import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lightningAddress: string | undefined =
      typeof body.lightningAddress === 'string' ? body.lightningAddress.trim() :
      typeof body.speedAddress === 'string' ? body.speedAddress.trim() : undefined;
    const username: string | undefined =
      typeof body.username === 'string' ? body.username.trim() : undefined;

    if (!username || !lightningAddress) {
      return NextResponse.json(
        { error: 'Name and Lightning address are required' },
        { status: 400 }
      );
    }

    console.log(`Check-in attempt for stream ${id}: ${username} (${lightningAddress})`);

    // Ensure stream exists for serverless resilience
    store.ensureStreamExists(id);

    const participant = store.addParticipant(id, username, lightningAddress);
    console.log('New participant added:', participant);
    
    return NextResponse.json({ 
      message: 'Successfully checked in!', 
      participant 
    });
  } catch (error: unknown) {
    console.error('Error during check-in:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
