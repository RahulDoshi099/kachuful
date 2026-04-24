'use client';

import { useEffect, useState, useCallback, useReducer, use } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, Card } from '@/lib/types';
import { Room } from '@/lib/roomStore';
import {
  placeBid, playCard, advanceRound,
  getValidBids, getValidCards,
} from '@/lib/gameEngine';
import ScoreBoard from '@/components/ScoreBoard';
import TrickArea from '@/components/TrickArea';
import BiddingPanel from '@/components/BiddingPanel';
import RoundSummary from '@/components/RoundSummary';
import GameOverScreen from '@/components/GameOverScreen';
import MultiplayerHand from '@/components/MultiplayerHand';

type GameAction =
  | { type: 'BID'; playerId: string; bid: number }
  | { type: 'PLAY_CARD'; playerId: string; card: Card }
  | { type: 'NEXT_ROUND' }
  | { type: 'SET'; state: GameState };

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'BID': return placeBid(state, action.playerId, action.bid);
    case 'PLAY_CARD': return playCard(state, action.playerId, action.card);
    case 'NEXT_ROUND': return advanceRound(state);
    case 'SET': return action.state;
    default: return state;
  }
}

function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('kachuful_player_id') ?? '';
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, dispatch] = useReducer(reducer, null as unknown as GameState);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const playerId = typeof window !== 'undefined' ? getPlayerId() : '';

  const fetchRoom = useCallback(async () => {
    try {
      const query = playerId ? `?playerId=${encodeURIComponent(playerId)}` : '';
      const res = await fetch(`/api/room/${code}${query}`);
      if (!res.ok) { setError('Room not found'); return; }
      const data = await res.json();
      setRoom(data.room);
      if (data.room.gameState) {
        dispatch({ type: 'SET', state: data.room.gameState });
      }
    } catch {
      setError('Connection error');
    }
  }, [code, playerId]);

  useEffect(() => {
    const boot = setTimeout(() => {
      void fetchRoom();
    }, 0);
    const interval = setInterval(fetchRoom, 1000);
    return () => {
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, [fetchRoom]);

  const pushState = useCallback(async (state: GameState) => {
    await fetch(`/api/room/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', gameState: state, playerId }),
    });
  }, [code, playerId]);

  async function handleStart() {
    const res = await fetch(`/api/room/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', playerId }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    setRoom(data.room);
    dispatch({ type: 'SET', state: data.room.gameState });
  }

  async function handleBid(bid: number) {
    const next = placeBid(gameState, playerId, bid);
    dispatch({ type: 'SET', state: next });
    await pushState(next);
  }

  async function handlePlayCard(card: Card) {
    if (!gameState) return;
    const valid = getValidCards(gameState, playerId);
    if (!valid.find((c) => c.id === card.id)) return;
    const next = playCard(gameState, playerId, card);
    dispatch({ type: 'SET', state: next });
    await pushState(next);
  }

  async function handleNextRound() {
    const next = advanceRound(gameState);
    dispatch({ type: 'SET', state: next });
    await pushState(next);
  }

  function copyCode() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(el);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white p-4">
        <div className="text-center max-w-sm w-full">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button onClick={() => router.push('/lobby')} className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-xl">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white p-4">
        <div className="animate-pulse text-green-400">Loading room...</div>
      </div>
    );
  }

  const isHost = room.hostId === playerId;
  const myPlayer = gameState?.players.find((p) => p.id === playerId);
  const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  if (!room.gameState) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white p-3 sm:p-4">
        <div className="bg-green-800 rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Room Lobby</h1>
          <p className="text-green-400 text-sm mb-6">Waiting for players...</p>

          <div className="bg-green-900 rounded-xl p-4 mb-6">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Room Code</p>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl font-mono font-bold tracking-widest text-yellow-400">{code}</span>
              <button onClick={copyCode} className="text-sm bg-green-700 hover:bg-green-600 px-3 py-1 rounded-lg transition-colors">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">
              Players ({room.players.length}/{room.maxPlayers})
            </p>
            <div className="flex flex-col gap-2">
              {room.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 bg-green-700 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm truncate">{p.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.id === room.hostId && <span className="text-xs bg-yellow-600 text-black px-2 py-0.5 rounded-full">Host</span>}
                    {p.id === playerId && <span className="text-xs text-green-400">You</span>}
                  </div>
                </div>
              ))}
              {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                <div key={i} className="bg-green-900 rounded-lg px-3 py-2 text-green-600 text-sm italic">
                  Waiting for player...
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={handleStart}
              disabled={room.players.length < 2}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
            >
              {room.players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
            </button>
          ) : (
            <p className="text-green-400 animate-pulse">Waiting for host to start...</p>
          )}
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  if (gameState.phase === 'gameOver') {
    return <GameOverScreen players={gameState.players} onReset={() => router.push('/lobby')} />;
  }

  const validCards = gameState.phase === 'playing' && isMyTurn && myPlayer
    ? getValidCards(gameState, playerId)
    : [];
  const validCardIds = new Set(validCards.map((c) => c.id));
  const tricksPlayed = gameState.completedTricks.length;
  const totalTricks = gameState.currentHandSize;
  const countdown = room.turnSecondsLeft ?? null;
  const totalTurnSeconds = Math.max(room.turnTimer ?? 10, 1);
  const remainingSeconds = Math.max(countdown ?? 0, 0);
  const percent = Math.min(100, Math.max(0, (remainingSeconds / totalTurnSeconds) * 100));
  const timerStroke = remainingSeconds <= 3 ? '#ef4444' : remainingSeconds <= 6 ? '#facc15' : '#4ade80';
  const ringSize = 52;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percent / 100);
  const showCenterTimer = (gameState.phase === 'playing' || gameState.phase === 'bidding') && countdown !== null;

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 px-3 sm:px-4 lg:px-6 py-3 bg-green-950 shadow">
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          <h1 className="text-lg sm:text-xl font-bold">Kachuful</h1>
          <button onClick={copyCode} className="text-xs bg-green-800 hover:bg-green-700 px-2 py-1 rounded font-mono">
            {copied ? '✓' : code}
          </button>
          <button onClick={fetchRoom} className="text-xs bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded">
            🔄 Refresh
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <span className="bg-green-800 px-2.5 sm:px-3 py-1 rounded-full">
            Hand {gameState.currentHandIndex + 1}/{gameState.handSizes.length} — {gameState.currentHandSize} cards
          </span>
          <span className="bg-yellow-700 px-2.5 sm:px-3 py-1 rounded-full capitalize flex items-center gap-1">
            Trump:{' '}
            {gameState.trumpSuit === 'spades' && '♠'}
            {gameState.trumpSuit === 'hearts' && '♥'}
            {gameState.trumpSuit === 'diamonds' && '♦'}
            {gameState.trumpSuit === 'clubs' && '♣'}
            <span className="ml-1">{gameState.trumpSuit}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="order-2 lg:order-1 flex-1 flex flex-col gap-3 sm:gap-4">
          {showCenterTimer && currentPlayer && (
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-3 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 bg-green-950/80 border border-green-600/60 shadow max-w-full">
                <div className="text-center leading-tight">
                  <p className="text-[11px] uppercase tracking-wider text-green-400">Current Turn</p>
                  <p className="font-semibold text-white max-w-[150px] sm:max-w-[200px] truncate">{currentPlayer.name}</p>
                </div>
                <div className="relative" style={{ width: ringSize, height: ringSize }}>
                  <svg width={ringSize} height={ringSize} className="-rotate-90">
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={strokeWidth}
                      fill="transparent"
                    />
                    <circle
                      cx={ringSize / 2}
                      cy={ringSize / 2}
                      r={radius}
                      stroke={timerStroke}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      fill="transparent"
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: dashOffset,
                        transition: 'stroke-dashoffset 1s linear',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-mono font-bold text-sm bg-gray-700/75 text-white px-2 py-0.5 rounded-md">
                      {remainingSeconds}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <TrickArea
            trick={gameState.currentTrick}
            players={gameState.players}
            trumpSuit={gameState.trumpSuit}
            tricksPlayed={tricksPlayed}
            totalTricks={totalTricks}
          />

          {gameState.phase === 'roundEnd' && (
            <RoundSummary
              players={gameState.players}
              onContinue={isHost ? handleNextRound : undefined}
              isHost={isHost}
            />
          )}

          {gameState.phase === 'bidding' && !isMyTurn && (
            <div className="text-center py-4">
              <div className="text-green-300 animate-pulse text-base sm:text-lg mb-2">
                {currentPlayer?.name} is bidding...
              </div>
              <p className="text-xs text-green-500 mb-2">
                (Waiting for {currentPlayer?.name} to place their bid on their device)
              </p>
              <div className="text-xs text-green-600 mt-4">
                <p>Bidding Progress: {gameState.biddingIndex + 1} / {gameState.players.length}</p>
                <div className="flex justify-center flex-wrap gap-2 mt-2">
                  {gameState.players.map((p) => (
                    <div key={p.id} className={`px-2 py-1 rounded text-xs ${p.bid !== null ? 'bg-green-700' : 'bg-green-900'}`}>
                      {p.name}: {p.bid !== null ? p.bid : '?'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {gameState.phase === 'playing' && !isMyTurn && (
            <div className="text-center py-4">
              <div className="text-green-300 animate-pulse text-base sm:text-lg mb-2">
                {currentPlayer?.name}&apos;s turn to play...
              </div>
              <p className="text-xs text-green-500">
                (Waiting for {currentPlayer?.name} to play a card on their device)
              </p>
            </div>
          )}
        </div>

        {/* Scoreboard on the right */}
        <div className="order-1 lg:order-2 w-full lg:w-52 shrink-0">
          <ScoreBoard
            players={gameState.players}
            dealerIndex={gameState.dealerIndex}
            currentPlayerIndex={gameState.currentPlayerIndex}
            phase={gameState.phase}
            connectedById={Object.fromEntries(room.players.map((p) => [p.id, p.connected]))}
          />
        </div>
      </div>

      {/* Bidding panel + hand at bottom */}
      {myPlayer && (
        <div className="bg-green-950 px-3 sm:px-4 pt-3 pb-4 flex flex-col items-center gap-3">
          {gameState.phase === 'bidding' && isMyTurn && (
            <div className="w-full max-w-lg">
              <div className="text-center mb-2">
                <span className="bg-yellow-500 text-black px-4 py-1 rounded-full font-bold text-sm">
                  🎯 YOUR TURN TO BID
                </span>
              </div>
              <BiddingPanel
                validBids={getValidBids(gameState, playerId)}
                handSize={gameState.currentHandSize}
                onBid={handleBid}
              />
            </div>
          )}

          <div className="w-full">
            <MultiplayerHand
              player={myPlayer}
              validCardIds={validCardIds}
              onPlayCard={handlePlayCard}
              isActive={isMyTurn && gameState.phase === 'playing'}
            />
          </div>
        </div>
      )}
    </div>
  );
}
