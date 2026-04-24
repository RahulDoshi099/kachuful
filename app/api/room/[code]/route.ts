import { NextRequest, NextResponse } from 'next/server';
import { getRoom, startGame, updateGameState } from '@/lib/roomStore';
import { GameState } from '@/lib/types';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  console.log('GET /api/room/[code] - Looking for room:', code);
  const room = getRoom(code);
  if (!room) {
    console.log('Room not found:', code);
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  console.log('Room found:', { code: room.code, players: room.players.length });
  return NextResponse.json({ room });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await req.json();

  if (body.action === 'start') {
    const room = startGame(code);
    if (!room) return NextResponse.json({ error: 'Cannot start' }, { status: 400 });
    return NextResponse.json({ room });
  }

  if (body.action === 'update' && body.gameState) {
    updateGameState(code, body.gameState as GameState);
    const room = getRoom(code);
    return NextResponse.json({ room });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
