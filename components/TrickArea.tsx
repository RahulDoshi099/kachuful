'use client';

import { useEffect, useState } from 'react';
import { Player, Suit, Trick } from '@/lib/types';
import CardComponent from './CardComponent';

interface Props {
  trick: Trick;
  players: Player[];
  trumpSuit: Suit;
  tricksPlayed: number;
  totalTricks: number;
}

export default function TrickArea({ trick, players, trumpSuit, tricksPlayed, totalTricks }: Props) {
  const [revealCountdown, setRevealCountdown] = useState<number | null>(null);

  const trickComplete = trick.cards.length === players.length && trick.winnerId !== null;
  const winningCardId = trick.winnerId
    ? trick.cards.find(({ playerId }) => playerId === trick.winnerId)?.card.id
    : null;
  const winnerName = players.find((p) => p.id === trick.winnerId)?.name;

  // Countdown while trick is being revealed
  useEffect(() => {
    if (!trickComplete) { setRevealCountdown(null); return; }
    setRevealCountdown(3);
    const interval = setInterval(() => {
      setRevealCountdown((prev) => {
        if (prev === null || prev <= 1) { clearInterval(interval); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [trickComplete, trick.winnerId]);

  return (
    <div className="bg-green-800 rounded-xl p-4 min-h-40 flex flex-col gap-3 relative overflow-visible">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-green-400 font-semibold uppercase tracking-wider">
          Current Trick {trick.leadSuit ? `— Lead: ${trick.leadSuit}` : ''}
        </div>
        <div className="flex items-center gap-1.5 bg-green-900 px-3 py-1 rounded-full">
          <span className="text-xs text-green-400 uppercase tracking-wider">Trick</span>
          <span className="font-bold text-white text-sm">
            {tricksPlayed + (trick.cards.length > 0 && !trickComplete ? 1 : 0)}
          </span>
          <span className="text-green-500 text-xs">/ {totalTricks}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-6 flex-wrap items-end justify-center flex-1 pb-2">
        {trick.cards.length === 0 && (
          <span className="text-green-600 italic text-sm self-center">No cards played yet</span>
        )}

        {trick.cards.map(({ playerId, card }) => {
          const player = players.find((p) => p.id === playerId);
          const isWinner = trickComplete && winningCardId === card.id;

          return (
            <div
              key={card.id}
              className={`flex flex-col items-center gap-1 transition-all duration-500 ${
                isWinner ? '-translate-y-3' : ''
              }`}
            >
              <span className={`text-xs font-semibold ${isWinner ? 'text-yellow-300' : 'text-green-300'}`}>
                {player?.name}
              </span>

              {/* Card with winner highlight ring */}
              <div className={`relative transition-all duration-500 ${
                isWinner
                  ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-green-800 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.7)]'
                  : trickComplete
                  ? 'opacity-50'
                  : ''
              }`}>
                <CardComponent card={card} isPlayed />
                {isWinner && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
                    👑 Winner
                  </div>
                )}
              </div>

              {card.suit === trumpSuit && (
                <span className={`text-xs ${isWinner ? 'text-yellow-300 font-bold' : 'text-yellow-500'}`}>
                  trump
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Winner banner + countdown */}
      {trickComplete && winnerName && (
        <div className="flex items-center justify-center gap-3 mt-1">
          <div className="bg-yellow-400 text-black font-bold px-5 py-1.5 rounded-full text-sm shadow-lg">
            🏆 {winnerName} wins this trick!
          </div>
          {revealCountdown !== null && (
            <span className="text-green-400 text-xs font-mono">next in {revealCountdown}s</span>
          )}
        </div>
      )}
    </div>
  );
}
