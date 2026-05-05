import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/roomStore';
import { BANNED_NAME_ERROR, isBannedPlayerName, sanitizePlayerName } from '@/lib/nameRules';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, playerId, playerName } = body;
    const codeStr = typeof code === 'string' ? code.trim().toUpperCase() : '';
    const playerIdStr = typeof playerId === 'string' ? playerId : '';
    const playerNameStr = sanitizePlayerName(playerName);
    
    console.log('Join room request:', { code: codeStr, playerId: playerIdStr, playerName: playerNameStr });
    
    if (!codeStr || !playerIdStr || !playerNameStr) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (isBannedPlayerName(playerNameStr)) {
      return NextResponse.json({ error: BANNED_NAME_ERROR }, { status: 400 });
    }
    
    const result = joinRoom(codeStr, playerIdStr, playerNameStr);
    
    if (!result.room) {
      console.log('Join failed:', result.error);
      const status = result.error === 'Room not found' ? 404 : 400;
      return NextResponse.json({ error: result.error || 'Failed to join room' }, { status });
    }
    
    console.log('Player joined room:', codeStr);
    return NextResponse.json({ room: result.room });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
