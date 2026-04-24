import { NextRequest, NextResponse } from 'next/server';
import { joinRoom } from '@/lib/roomStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, playerId, playerName } = body;
    
    console.log('Join room request:', { code, playerId, playerName });
    
    if (!code || !playerId || !playerName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const result = joinRoom(code, playerId, playerName);
    
    if (!result.room) {
      console.log('Join failed:', result.error);
      return NextResponse.json({ error: result.error || 'Failed to join room' }, { status: 404 });
    }
    
    console.log('Player joined room:', code);
    return NextResponse.json({ room: result.room });
  } catch (error) {
    console.error('Join room error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
