'use client';

import { useEffect, useState } from 'react';
import { Player } from '@/lib/types';

interface Props {
  players: Player[];
  onContinue?: () => void;
  isHost?: boolean;
}

export default function RoundSummary({ players, onContinue, isHost = true }: Props) {
  const [showWinner, setShowWinner] = useState(true);

  // Find the player who won the most tricks this round
  const roundWinner = [...players].sort((a, b) => {
    const aHit = a.bid !== null && a.tricksTaken === a.bid ? 1 : 0;
    const bHit = b.bid !== null && b.tricksTaken === b.bid ? 1 : 0;
    if (bHit !== aHit) return bHit - aHit;
    return (b.bid ?? 0) - (a.bid ?? 0);
  })[0];

  useEffect(() => {
    const timer = setTimeout(() => setShowWinner(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative bg-green-800 rounded-xl p-2 sm:p-3 text-center max-h-[60vh] overflow-y-auto flex flex-col">
      {/* Winner banner — shows for 5 seconds */}
      {showWinner && roundWinner && (
        <div className="mb-2 flex justify-center z-10 px-2">
          <div className="bg-yellow-400 text-black font-bold px-3 sm:px-4 py-1.5 rounded-full shadow-lg text-xs sm:text-sm animate-bounce max-w-full truncate">
            🏆 {roundWinner.name} wins!
          </div>
        </div>
      )}

      <h2 className="font-bold text-sm sm:text-base mb-2">Round Over</h2>
      
      {/* Compact List Format */}
      <div className="flex-1 space-y-1.5 mb-3 min-h-0 overflow-y-auto">
        {[...players].sort((a, b) => b.score - a.score).map((p) => {
          const hit = p.bid !== null && p.tricksTaken === p.bid;
          const roundPoints = hit ? 10 + p.bid! : 0;
          return (
            <div
              key={p.id}
              className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm flex items-center justify-between gap-2 ${
                hit ? 'bg-yellow-600 text-black' : 'bg-green-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-bold truncate">{p.name}</span>
                <span className="text-xs opacity-75 shrink-0">Bid {p.bid}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="opacity-75">{p.tricksTaken}</span>
                <span className="font-bold">{hit ? `+${roundPoints}` : '0'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Button - always visible at bottom */}
      <div className="flex-shrink-0 pt-2 border-t border-green-600/50 mt-auto">
        {isHost && onContinue ? (
          <button
            onClick={onContinue}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            Next Hand →
          </button>
        ) : (
          <p className="text-green-400 animate-pulse text-xs sm:text-sm py-2">Waiting for host...</p>
        )}
      </div>
    </div>
  );
}
