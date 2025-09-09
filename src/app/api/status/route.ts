import { NextResponse } from 'next/server';
import store from '@/lib/memory-store';
import SpeedAPI from '@/lib/speed-api';

const speedAPI = new SpeedAPI();

export async function GET() {
  try {
    const status = speedAPI.getStatus();
    const balance = await speedAPI.getBalance();
    const storeStatus = store.getStatus();
    
    return NextResponse.json({
      ...status,
      balance: balance.balance,
      balanceError: balance.error,
      store: storeStatus
    });
  } catch (error: unknown) {
    console.error('Error getting status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
