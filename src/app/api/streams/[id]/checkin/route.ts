import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { username, speedAddress } = await request.json();
    
    if (!username || !speedAddress) {
      return NextResponse.json(
        { error: 'Username and Speed address are required' }, 
        { status: 400 }
      );
    }
    
    console.log(`Check-in attempt for stream ${id}: ${username} (${speedAddress})`);
    
    // Ensure stream exists for serverless resilience
    const stream = store.ensureStreamExists(id);
    
    // Add participant
    const participant = store.addParticipant(id, username, speedAddress);
    console.log('New participant added:', participant);
    
    return NextResponse.json({ 
      message: 'Successfully checked in!', 
      participant 
    });
  } catch (error: any) {
    console.error('Error during check-in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 