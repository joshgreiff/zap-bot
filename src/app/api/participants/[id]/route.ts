import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const participant = store.getParticipant(id);
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Remove participant from store
    store.removeParticipant(id);
    
    console.log(`Participant ${id} removed`);
    
    return NextResponse.json({ message: 'Participant removed successfully' });
  } catch (error: unknown) {
    console.error('Error removing participant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
