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
    <div className="relative bg-green-800 rounded-xl p-3 sm:p-4 text-center">
      {/* Winner banner — shows for 5 seconds */}
      {showWinner && roundWinner && (
        <div className="absolute inset-x-0 -top-12 sm:-top-14 flex justify-center z-10 pointer-events-none px-2">
          <div className="bg-yellow-400 text-black font-bold px-4 sm:px-6 py-2 rounded-full shadow-lg text-sm sm:text-lg animate-bounce max-w-full truncate">
            🏆 {roundWinner.name} wins the round!
          </div>
        </div>
      )}

      <h2 className="font-bold text-base sm:text-lg mb-3">Round Over</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
        {[...players].sort((a, b) => b.score - a.score).map((p) => {
          const hit = p.bid !== null && p.tricksTaken === p.bid;
          const roundPoints = hit ? 10 + p.bid! : 0;
          return (
            <div
              key={p.id}
              className={`rounded-lg px-3 sm:px-4 py-2 text-sm ${hit ? 'bg-yellow-600 text-black' : 'bg-green-700'}`}
            >
              <div className="font-bold truncate">{p.name}</div>
              <div>Bid {p.bid} · Got {p.tricksTaken}</div>
              <div className={hit ? 'font-bold' : 'opacity-60'}>
                {hit ? `+${roundPoints}` : '0 pts'}
              </div>
              <div className="text-xs mt-1 opacity-80">Total: {p.score}</div>
            </div>
          );
        })}
      </div>
      {isHost && onContinue ? (
        <button
          onClick={onContinue}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-lg transition-colors w-full sm:w-auto"
        >
          Next Hand →
        </button>
      ) : (
        <p className="text-green-400 animate-pulse text-sm">Waiting for host to continue...</p>
      )}
    </div>
  );
}
