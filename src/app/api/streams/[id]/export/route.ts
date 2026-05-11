import { NextResponse } from 'next/server';
import store from '@/lib/memory-store';

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const stream = await store.getStream(id);

    if (!stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    const participants = await store.getParticipants(id);
    const rows = [
      ['name', 'lightning_address', 'checked_in_at'],
      ...participants.map((participant) => [
        participant.name,
        participant.lightning_address,
        participant.checked_in_at,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(','))
      .join('\n');

    const safeName = stream.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${safeName}-participants.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error exporting participants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
