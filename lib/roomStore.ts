// Server-side in-memory room store (lives in Node.js process)
import { GameState } from './types';
import { createInitialState } from './gameEngine';

export interface RoomPlayer {
  id: string;
  name: string;
  connected: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  maxPlayers: number;
  turnTimer: number;
  players: RoomPlayer[];
  gameState: GameState | null;
  createdAt: number;
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
  const room: Room = {
    code,
    hostId,
    maxPlayers,
    turnTimer,
    players: [{ id: hostId, name: hostName, connected: true }],
    gameState: null,
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function joinRoom(code: string, playerId: string, playerName: string): { room: Room | null; error?: string } {
  const room = rooms.get(code.toUpperCase());
  if (!room) return { room: null, error: 'Room not found' };
  
  // Reconnect if already in room
  const existing = room.players.find((p) => p.id === playerId);
  if (existing) {
    existing.connected = true;
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
  
  room.players.push({ id: playerId, name: playerName, connected: true });
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
  return room;
}

export function updateGameState(code: string, state: GameState): void {
  const room = rooms.get(code.toUpperCase());
  if (room) room.gameState = state;
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
