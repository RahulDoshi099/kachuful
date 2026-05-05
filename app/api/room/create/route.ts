import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';
import { BANNED_NAME_ERROR, isBannedPlayerName, sanitizePlayerName } from '@/lib/nameRules';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostId, hostName, maxPlayers, turnTimer } = body;
    const hostIdStr = typeof hostId === 'string' ? hostId : '';
    const hostNameStr = sanitizePlayerName(hostName);
    const maxPlayersNum = Number(maxPlayers);
    
    console.log('Create room request:', { hostId: hostIdStr, hostName: hostNameStr, maxPlayers: maxPlayersNum, turnTimer });
    
    if (!hostIdStr || !hostNameStr || !Number.isFinite(maxPlayersNum)) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (isBannedPlayerName(hostNameStr)) {
      return NextResponse.json({ error: BANNED_NAME_ERROR }, { status: 400 });
    }
    
    const room = createRoom(
      hostIdStr,
      hostNameStr,
      Math.min(Math.max(maxPlayersNum, 2), 15),
      turnTimer ? Number(turnTimer) : 30
    );
    console.log('Room created successfully:', { code: room.code, hostId: hostIdStr, hostName: hostNameStr, turnTimer: room.turnTimer });
    
    return NextResponse.json({ code: room.code, room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
