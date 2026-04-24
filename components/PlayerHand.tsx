'use client';

import { Card, Player } from '@/lib/types';
import CardComponent from './CardComponent';

interface Props {
  player: Player;
  validCardIds: Set<string>;
  onPlayCard: (card: Card) => void;
  isActive: boolean;
}

export default function PlayerHand({ player, validCardIds, onPlayCard, isActive }: Props) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
        <span className="text-sm font-semibold text-green-300">Your Hand</span>
        {player.bid !== null && (
          <span className="text-xs bg-green-800 px-2 py-0.5 rounded-full">
            Bid: {player.bid} | Tricks: {player.tricksTaken}
          </span>
        )}
        {!isActive && (
          <span className="text-xs text-green-500 italic">waiting...</span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {player.hand.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            isValid={isActive && validCardIds.has(card.id)}
            onClick={() => isActive && validCardIds.has(card.id) && onPlayCard(card)}
          />
        ))}
        {player.hand.length === 0 && (
          <span className="text-green-600 text-sm italic">No cards</span>
        )}
      </div>
    </div>
  );
}
