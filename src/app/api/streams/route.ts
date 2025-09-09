import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import store from '@/lib/memory-store';

export async function GET() {
  try {
    const streams = store.getAllStreams().filter((s: any) => s.is_active);
    return NextResponse.json(streams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    const streamId = uuidv4();
    
    console.log(`Creating stream: ${streamId} with name: ${name}`);
    
    const stream = store.createStream(streamId, name);
    console.log('Stream created successfully:', stream);
    
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      'https://zap-bot.vercel.app' : 
      `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    
    return NextResponse.json({
      streamId,
      name,
      checkInUrl: `${baseUrl}/checkin/${streamId}`,
      adminUrl: `${baseUrl}/admin/${streamId}`,
      wheelUrl: `${baseUrl}/wheel/${streamId}`
    });
  } catch (error: any) {
    console.error('Error creating stream:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 