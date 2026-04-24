import { NextRequest, NextResponse } from 'next/server';
import { createRoom } from '@/lib/roomStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hostId, hostName, maxPlayers, turnTimer } = body;
    
    console.log('Create room request:', { hostId, hostName, maxPlayers, turnTimer });
    
    if (!hostId || !hostName || !maxPlayers) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const room = createRoom(
      hostId, 
      hostName, 
      Math.min(Math.max(Number(maxPlayers), 2), 15),
      turnTimer ? Number(turnTimer) : 10
    );
    console.log('Room created successfully:', { code: room.code, hostId, hostName, turnTimer: room.turnTimer });
    
    return NextResponse.json({ code: room.code, room });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
