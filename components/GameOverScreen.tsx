'use client';

import { Player } from '@/lib/types';

interface Props {
  players: Player[];
  onReset: () => void;
}

export default function GameOverScreen({ players, onReset }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">
      <div className="bg-green-800 rounded-2xl p-8 text-center max-w-md w-full shadow-2xl">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold mb-1">Game Over!</h1>
        <p className="text-green-300 mb-6">{winner.name} wins with {winner.score} points!</p>

        <div className="flex flex-col gap-2 mb-8">
          {sorted.map((p, i) => (
            <div
              key={p.id}
              className={`flex justify-between items-center px-4 py-2 rounded-lg ${
                i === 0 ? 'bg-yellow-600 text-black font-bold' : 'bg-green-700'
              }`}
            >
              <span>{i + 1}. {p.name}</span>
              <span>{p.score} pts</span>
            </div>
          ))}
        </div>

        <button
          onClick={onReset}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl text-lg transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
