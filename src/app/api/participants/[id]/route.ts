import { NextRequest, NextResponse } from 'next/server';
import store from '@/lib/memory-store';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const participant = store.getParticipant(id);
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }
    
    // Remove participant from store
    store.removeParticipant(id);
    
    console.log(`Participant ${id} removed`);
    
    return NextResponse.json({ message: 'Participant removed successfully' });
  } catch (error: any) {
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 