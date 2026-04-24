// Server-side in-memory room store (lives in Node.js process)
import { GameState } from './types';
import { advanceTrick, aiBid, aiPlayCard, createInitialState, placeBid, playCard } from './gameEngine';

export interface RoomPlayer {
  id: string;
  name: string;
  connected: boolean;
  lastSeenAt: number;
}

export interface Room {
  code: string;
  hostId: string;
  maxPlayers: number;
  turnTimer: number;
  players: RoomPlayer[];
  gameState: GameState | null;
  createdAt: number;
  turnKey: string | null;
  turnStartedAt: number | null;
  turnSecondsLeft: number;
  revealStartedAt: number | null;
}

const INACTIVITY_TIMEOUT_MS = 12000;
const TRICK_REVEAL_MS = 3000;
const MAX_AUTOPLAY_STEPS_PER_TICK = 32;

function getTurnKey(state: GameState): string | null {
  if (state.phase !== 'bidding' && state.phase !== 'playing') return null;
  return [
    state.phase,
    state.currentHandIndex,
    state.currentPlayerIndex,
    state.biddingIndex,
    state.completedTricks.length,
    state.currentTrick.cards.length,
  ].join(':');
}

function getConnectedRoomPlayer(room: Room, playerId: string): RoomPlayer | undefined {
  return room.players.find((p) => p.id === playerId);
}

function refreshConnections(room: Room, now: number): void {
  for (const player of room.players) {
    player.connected = now - player.lastSeenAt <= INACTIVITY_TIMEOUT_MS;
  }
}

function resetTurnClock(room: Room): void {
  room.turnKey = null;
  room.turnStartedAt = null;
  room.turnSecondsLeft = 0;
}

function ensureTurnClock(room: Room, state: GameState, now: number): void {
  const key = getTurnKey(state);
  if (!key) {
    resetTurnClock(room);
    return;
  }

  if (room.turnKey !== key || room.turnStartedAt === null) {
    room.turnKey = key;
    room.turnStartedAt = now;
  }

  const elapsedSeconds = Math.floor((now - room.turnStartedAt) / 1000);
  room.turnSecondsLeft = Math.max(room.turnTimer - elapsedSeconds, 0);
}

function tickRoom(room: Room): void {
  if (!room.gameState) {
    resetTurnClock(room);
    room.revealStartedAt = null;
    return;
  }

  let state = room.gameState;

  for (let i = 0; i < MAX_AUTOPLAY_STEPS_PER_TICK; i++) {
    const now = Date.now();
    refreshConnections(room, now);

    if (state.phase === 'trickReveal') {
      if (room.revealStartedAt === null) room.revealStartedAt = now;
      if (now - room.revealStartedAt >= TRICK_REVEAL_MS) {
        state = advanceTrick(state);
        room.gameState = state;
        room.revealStartedAt = null;
        resetTurnClock(room);
        continue;
      }
      room.turnSecondsLeft = 0;
      break;
    }

    room.revealStartedAt = null;
    ensureTurnClock(room, state, now);

    if (state.phase !== 'bidding' && state.phase !== 'playing') {
      break;
    }

    const currentPlayer = state.players[state.currentPlayerIndex];
    const roomPlayer = getConnectedRoomPlayer(room, currentPlayer.id);
    const isDisconnected = roomPlayer ? !roomPlayer.connected : true;
    const shouldAutoAct = isDisconnected || room.turnSecondsLeft <= 0;

    if (!shouldAutoAct) break;

    if (state.phase === 'bidding') {
      const bid = aiBid(state, currentPlayer.id);
      state = placeBid(state, currentPlayer.id, bid);
    } else {
      const card = aiPlayCard(state, currentPlayer.id);
      state = playCard(state, currentPlayer.id, card);
    }

    room.gameState = state;
    resetTurnClock(room);
  }
}

// Global store — persists across requests in dev (single process)
// Use globalThis to prevent hot reload from clearing the store
const globalForRooms = globalThis as unknown as {
  rooms: Map<string, Room> | undefined;
};

const rooms = globalForRooms.rooms ?? new Map<string, Room>();

if (process.env.NODE_ENV !== 'production') {
  globalForRooms.rooms = rooms;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function createRoom(hostId: string, hostName: string, maxPlayers: number, turnTimer: number = 10): Room {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  const now = Date.now();
  const room: Room = {
    code,
    hostId,
    maxPlayers,
    turnTimer,
    players: [{ id: hostId, name: hostName, connected: true, lastSeenAt: now }],
    gameState: null,
    createdAt: now,
    turnKey: null,
    turnStartedAt: null,
    turnSecondsLeft: 0,
    revealStartedAt: null,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  tickRoom(room);
  return room;
}

export function touchPlayer(code: string, playerId: string): Room | undefined {
  const room = rooms.get(code.toUpperCase());
  if (!room) return undefined;
  const player = room.players.find((p) => p.id === playerId);
  if (player) {
    player.lastSeenAt = Date.now();
    player.connected = true;
  }
  tickRoom(room);
  return room;
}

export function joinRoom(code: string, playerId: string, playerName: string): { room: Room | null; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { room: null, error: 'Room not found' };
  
  // Reconnect if already in room
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
    existing.lastSeenAt = Date.now();
    return { room };
  }
  
  // Check if room is full
  if (room.players.length >= room.maxPlayers) {
    return { room: null, error: 'Room is full' };
  }
  
  // Check for duplicate name (case-insensitive)
  const nameLower = playerName.toLowerCase();
  const nameExists = room.players.some((p) => p.name.toLowerCase() === nameLower);
  if (nameExists) {
    return { room: null, error: 'Name already taken in this room' };
  }
  
  room.players.push({ id: playerId, name: playerName, connected: true, lastSeenAt: Date.now() });
  return { room };
}

export function startGame(code: string): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.players.length < 2) return null;
  room.gameState = createInitialState(
    room.players.map((p) => p.name),
    room.players.map(() => 'human' as const),
    room.players.map((p) => p.id)   // pass real player IDs
  );
  room.revealStartedAt = null;
  resetTurnClock(room);
  tickRoom(room);
  return room;
}

export function updateGameState(code: string, state: GameState): void {
  const room = rooms.get(code.toUpperCase());
  if (room) {
    room.gameState = state;
    room.revealStartedAt = state.phase === 'trickReveal' ? room.revealStartedAt ?? Date.now() : null;
    resetTurnClock(room);
    tickRoom(room);
  }
}

export function listRooms(): Room[] {
  return Array.from(rooms.values());
}

export function getRoomCount(): number {
  return rooms.size;
}

export function getAllRoomCodes(): string[] {
  return Array.from(rooms.keys());
}

// Clean up old rooms (>4 hours)
export function cleanupRooms(): void {
  const cutoff = Date.now() - 4 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.createdAt < cutoff) rooms.delete(code);
  }
}
