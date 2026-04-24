'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('kachuful_player_id');
  if (!id) {
    id = `p_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('kachuful_player_id', id);
  }
  return id;
}

export default function LobbyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [turnTimer, setTurnTimer] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    const playerId = getOrCreatePlayerId();
    
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hostId: playerId, 
          hostName: playerName.trim(), 
          maxPlayers,
          turnTimer
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }
      
      localStorage.setItem('kachuful_player_name', playerName.trim());
      router.push(`/room/${data.code}`);
    } catch (e: unknown) {
      console.error('Create room error:', e);
      setError(e instanceof Error ? e.message : 'Failed to create room');
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!joinCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    const playerId = getOrCreatePlayerId();
    const code = joinCode.trim().toUpperCase();
    
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code, 
          playerId, 
          playerName: playerName.trim() 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }
      
      localStorage.setItem('kachuful_player_name', playerName.trim());
      router.push(`/room/${code}`);
    } catch (e: unknown) {
      console.error('Join room error:', e);
      setError(e instanceof Error ? e.message : 'Failed to join room');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center text-white p-3 sm:p-4">
      <div className="bg-green-800 rounded-2xl p-4 sm:p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">🃏 Kachuful</h1>
        <p className="text-green-300 text-center text-sm mb-5 sm:mb-6">Trick-taking card game</p>

        {/* Player name */}
        <div className="mb-6">
          <label className="text-xs text-green-400 uppercase tracking-wider mb-1 block">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-green-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
            placeholder="Enter your name"
            maxLength={30}
          />
          <p className="text-xs text-green-500 mt-1 leading-relaxed">
            Choose a unique name (case-insensitive)
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-lg overflow-hidden mb-6 border border-green-700">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'create' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            Create Room
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${
              tab === 'join' 
                ? 'bg-yellow-500 text-black' 
                : 'bg-green-700 hover:bg-green-600 text-white'
            }`}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-green-400 uppercase tracking-wider mb-2 block">
                Number of Players
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMaxPlayers((p) => Math.max(2, p - 1))}
                  className="w-10 h-10 rounded-lg bg-green-700 hover:bg-green-600 text-white font-bold text-xl transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center text-3xl font-bold text-yellow-400">
                  {maxPlayers}
                </span>
                <button
                  type="button"
                  onClick={() => setMaxPlayers((p) => Math.min(15, p + 1))}
                  className="w-10 h-10 rounded-lg bg-green-700 hover:bg-green-600 text-white font-bold text-xl transition-colors"
                >
                  +
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-green-400">
                <span className="shrink-0">Min: 2</span>
                <span className="text-yellow-400 font-semibold">
                  {Math.min(Math.floor(52 / maxPlayers), 10)} cards/player · {Math.min(Math.floor(52 / maxPlayers), 10) * 2 - 1} hands total
                </span>
                <span className="shrink-0">Max: 15</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-green-400 uppercase tracking-wider mb-2 block">
                Turn Timer (seconds)
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[10, 15, 20, 30, 35, 40, 45, 50, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTurnTimer(sec)}
                    className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                      turnTimer === sec 
                        ? 'bg-yellow-500 text-black' 
                        : 'bg-green-700 hover:bg-green-600 text-white'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
              <p className="text-xs text-green-500 mt-1">
                Auto-play after timer expires during card play
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !playerName.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        {tab === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-green-400 uppercase tracking-wider mb-1 block">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="w-full bg-green-700 rounded-lg px-3 py-2 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !playerName.trim() || !joinCode.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded-lg">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
