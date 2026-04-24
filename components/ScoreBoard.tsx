'use client';

import { GamePhase, Player } from '@/lib/types';

interface Props {
  players: Player[];
  dealerIndex: number;
  currentPlayerIndex: number;
  phase: GamePhase;
  connectedById?: Record<string, boolean>;
}

export default function ScoreBoard({
  players,
  dealerIndex,
  currentPlayerIndex,
  phase,
  connectedById,
}: Props) {
  // Sort by score descending, keep original index for dealer/current checks
  const sorted = [...players]
    .map((p, i) => ({ player: p, originalIndex: i }))
    .sort((a, b) => b.player.score - a.player.score);

  return (
    <div className="bg-green-800 rounded-xl p-3 text-sm w-full">
      <h2 className="font-bold text-green-300 mb-3 uppercase tracking-wider text-xs">Scores</h2>
      <div className="flex flex-col gap-2">
        {sorted.map(({ player, originalIndex }, rank) => {
          const isDealer = originalIndex === dealerIndex;
          const isCurrent = originalIndex === currentPlayerIndex && phase !== 'roundEnd';
          const isConnected = connectedById ? connectedById[player.id] !== false : true;

          return (
            <div
              key={player.id}
              className={`rounded-lg px-2 py-1.5 transition-colors ${
                isCurrent ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black' : 'bg-green-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  {rank === 0 && player.score > 0 && (
                    <span className="text-xs">🥇</span>
                  )}
                  <span className="font-semibold truncate max-w-[130px] sm:max-w-[96px] md:max-w-[130px]">
                    {player.name}
                    {isDealer && <span className="ml-1 text-xs opacity-70">(D)</span>}
                  </span>
                  {!isConnected && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-red-800 text-red-100">AI</span>
                  )}
                </div>
                <span className="font-bold text-base leading-none shrink-0">{player.score}</span>
              </div>
              {phase !== 'setup' && (
                <div className="text-xs opacity-80 mt-1">
                  {player.bid !== null ? (
                    <span>{player.tricksTaken}/{player.bid} got/bid</span>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
