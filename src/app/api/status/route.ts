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
  } catch (error: any) {
    console.error('Error getting status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 