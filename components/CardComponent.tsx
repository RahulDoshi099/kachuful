'use client';

import { Card } from '@/lib/types';

interface Props {
  card: Card;
  onClick?: () => void;
  isValid?: boolean;
  isPlayed?: boolean;
  small?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS: Record<string, string> = {
  spades: 'text-gray-900',
  clubs: 'text-gray-900',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
};

export default function CardComponent({ card, onClick, isValid, isPlayed, small }: Props) {
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];
  const size = small ? 'w-12 h-16' : 'w-14 h-20 sm:w-16 sm:h-24 md:w-20 md:h-28';

  return (
    <button
      onClick={onClick}
      disabled={!isValid && !isPlayed}
      className={`
        ${size} rounded-lg border-2 bg-white flex flex-col justify-between p-1.5 sm:p-2 font-bold
        transition-all duration-150 select-none relative
        ${isPlayed ? 'border-gray-300 opacity-90 cursor-default' : ''}
        ${isValid ? 'border-yellow-400 hover:-translate-y-2 hover:shadow-lg cursor-pointer' : ''}
        ${!isValid && !isPlayed ? 'border-gray-200 opacity-50 cursor-not-allowed' : ''}
        ${color}
      `}
    >
      {/* Top-left corner */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className={small ? 'text-xs' : 'text-base font-bold'}>{card.rank}</span>
        <span className={small ? 'text-xs' : 'text-sm'}>{symbol}</span>
      </div>

      {/* Center - large suit symbol */}
      <div className="flex-1 flex items-center justify-center">
        <span className={small ? 'text-2xl' : 'text-4xl'}>{symbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180">
        <span className={small ? 'text-xs' : 'text-base font-bold'}>{card.rank}</span>
        <span className={small ? 'text-xs' : 'text-sm'}>{symbol}</span>
      </div>
    </button>
  );
}
