import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';
import SpeedAPI from '@/lib/speed-api';

const speedAPI = new SpeedAPI();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { winner, amount = 1000 } = await request.json();
    
    if (!winner) {
      return NextResponse.json(
        { error: 'Winner participant ID is required' }, 
        { status: 400 }
      );
    }
    
    // Ensure stream exists for serverless resilience
    store.ensureStreamExists(id);
    
    // Get winner's participant info (winner is participant ID)
    const participant = store.getParticipant(winner);
    
    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' }, 
        { status: 404 }
      );
    }
    
    // Send the zap via Speed API
    const zapResult = await speedAPI.sendZap(
      participant.speed_address,
      amount,
      `Stream wheel win - ${participant.name}`
    );
    
    const status = zapResult.success ? (zapResult.simulated ? 'simulated' : 'completed') : 'failed';
    
    // Record the zap in store
    store.addZap(id, winner, amount, status);
    
    return NextResponse.json({
      message: zapResult.success ? 
        (zapResult.simulated ? 'Winner selected and zap simulated!' : 'Winner selected and zap sent!') :
        'Winner selected but zap failed',
      winner: participant.name,
      amount,
      speedAddress: participant.speed_address,
      zapResult: zapResult
    });
    
  } catch (error: unknown) {
    console.error('Spin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
