'use client';

import { useEffect, useState, useCallback, useReducer, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GameState, Card } from '@/lib/types';
import { Room } from '@/lib/roomStore';
import {
  placeBid, playCard, advanceRound, advanceTrick,
  getValidBids, getValidCards, aiPlayCard,
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
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoActedRef = useRef<string>('');
  const playerId = typeof window !== 'undefined' ? getPlayerId() : '';

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${code}`);
      if (!res.ok) { setError('Room not found'); return; }
      const data = await res.json();
      setRoom(data.room);
      if (data.room.gameState) {
        dispatch({ type: 'SET', state: data.room.gameState });
      }
    } catch {
      setError('Connection error');
    }
  }, [code]);

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 1000);
    return () => clearInterval(interval);
  }, [fetchRoom]);

  const pushState = useCallback(async (state: GameState) => {
    await fetch(`/api/room/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', gameState: state }),
    });
  }, [code]);

  async function handleStart() {
    const res = await fetch(`/api/room/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
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

  // Auto-advance after trick reveal (3 second pause so players can see the winner)
  useEffect(() => {
    if (!gameState || gameState.phase !== 'trickReveal') return;
    const timer = setTimeout(async () => {
      const next = advanceTrick(gameState);
      dispatch({ type: 'SET', state: next });
      await pushState(next);
    }, 3000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.phase, gameState?.completedTricks?.length]);

  // Auto-play countdown
  useEffect(() => {
    if (!gameState || !playerId || !room) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === playerId;
    // Only enable timer during PLAYING phase, not bidding
    const isPlayingPhase = gameState.phase === 'playing';    const turnKey = `${gameState.phase}-${gameState.currentPlayerIndex}-${gameState.biddingIndex}-${gameState.completedTricks.length}`;

    if (!isMyTurn || !isPlayingPhase) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(null);
      return;
    }

    if (autoActedRef.current === turnKey) return;
    autoActedRef.current = turnKey;

    if (countdownRef.current) clearInterval(countdownRef.current);
    const timerSeconds = room.turnTimer || 10;
    setCountdown(timerSeconds);

    let remaining = timerSeconds;
    countdownRef.current = setInterval(async () => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownRef.current!);
        setCountdown(null);

        // Auto-play card
        if (gameState.phase === 'playing') {
          const autoCard = aiPlayCard(gameState, playerId);
          const next = playCard(gameState, playerId, autoCard);
          dispatch({ type: 'SET', state: next });
          await pushState(next);
        }
      }
    }, 1000);

    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gameState?.phase,
    gameState?.currentPlayerIndex,
    gameState?.biddingIndex,
    gameState?.completedTricks?.length,
    playerId,
    room?.turnTimer,
  ]);

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
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">
        <div className="text-center">
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
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">
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
      <div className="min-h-screen bg-green-900 flex items-center justify-center text-white p-4">
        <div className="bg-green-800 rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <h1 className="text-2xl font-bold mb-1">Room Lobby</h1>
          <p className="text-green-400 text-sm mb-6">Waiting for players...</p>

          <div className="bg-green-900 rounded-xl p-4 mb-6">
            <p className="text-xs text-green-400 uppercase tracking-wider mb-2">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-4xl font-mono font-bold tracking-widest text-yellow-400">{code}</span>
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
                <div key={p.id} className="flex items-center justify-between bg-green-700 rounded-lg px-3 py-2">
                  <span className="font-mono text-sm">{p.name}</span>
                  <div className="flex items-center gap-2">
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
  const countdownColor = countdown !== null
    ? countdown <= 3 ? 'text-red-400' : countdown <= 6 ? 'text-yellow-400' : 'text-green-300'
    : '';

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-green-950 shadow">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Kachuful</h1>
          <button onClick={copyCode} className="text-xs bg-green-800 hover:bg-green-700 px-2 py-1 rounded font-mono">
            {copied ? '✓' : code}
          </button>
          <button onClick={fetchRoom} className="text-xs bg-blue-800 hover:bg-blue-700 px-2 py-1 rounded">
            🔄 Refresh
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="bg-green-800 px-3 py-1 rounded-full">
            Hand {gameState.currentHandIndex + 1}/{gameState.handSizes.length} — {gameState.currentHandSize} cards
          </span>
          <span className="bg-yellow-700 px-3 py-1 rounded-full capitalize flex items-center gap-1">
            Trump:{' '}
            {gameState.trumpSuit === 'spades' && '♠'}
            {gameState.trumpSuit === 'hearts' && '♥'}
            {gameState.trumpSuit === 'diamonds' && '♦'}
            {gameState.trumpSuit === 'clubs' && '♣'}
            <span className="ml-1">{gameState.trumpSuit}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 gap-4 p-4">
        <div className="flex-1 flex flex-col gap-4">
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
              <div className="text-green-300 animate-pulse text-lg mb-2">
                {currentPlayer?.name} is bidding...
              </div>
              <p className="text-xs text-green-500 mb-2">
                (Waiting for {currentPlayer?.name} to place their bid on their device)
              </p>
              <div className="text-xs text-green-600 mt-4">
                <p>Bidding Progress: {gameState.biddingIndex + 1} / {gameState.players.length}</p>
                <div className="flex justify-center gap-2 mt-2">
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
              <div className="text-green-300 animate-pulse text-lg mb-2">
                {currentPlayer?.name}&apos;s turn to play...
              </div>
              <p className="text-xs text-green-500">
                (Waiting for {currentPlayer?.name} to play a card on their device)
              </p>
            </div>
          )}
        </div>

        {/* Scoreboard on the right */}
        <div className="w-48 shrink-0">
          <ScoreBoard
            players={gameState.players}
            dealerIndex={gameState.dealerIndex}
            currentPlayerIndex={gameState.currentPlayerIndex}
            phase={gameState.phase}
          />
        </div>
      </div>

      {/* Bidding panel + hand at bottom */}
      {myPlayer && (
        <div className="bg-green-950 px-4 pt-3 pb-4 flex flex-col items-center gap-3">
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

          {gameState.phase === 'playing' && isMyTurn && countdown !== null && (
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold text-sm">⚡ Your turn to play!</span>
              <span className={`font-mono font-bold text-lg ${countdownColor}`}>{countdown}s</span>
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
