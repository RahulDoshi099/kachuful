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
  const size = small ? 'w-12 h-16' : 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36';
  const suitAccent = card.suit === 'hearts' || card.suit === 'diamonds'
    ? 'from-red-50 via-white to-rose-50'
    : 'from-slate-50 via-white to-slate-100';

  return (
    <button
      onClick={onClick}
      disabled={!isValid && !isPlayed}
      className={`
        ${size} rounded-xl border-2 bg-gradient-to-br ${suitAccent} flex flex-col justify-between p-1.5 sm:p-2 font-bold
        transition-all duration-150 select-none relative shadow-sm overflow-hidden
        ${isPlayed ? 'border-gray-300 opacity-95 cursor-default' : ''}
        ${isValid ? 'border-yellow-400 hover:-translate-y-2 hover:shadow-lg cursor-pointer' : ''}
        ${!isValid && !isPlayed ? 'border-gray-200 opacity-80 cursor-not-allowed' : ''}
        ${color}
      `}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(37,99,235,0.08),transparent_45%)]" />

      {/* Top-left corner */}
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none z-10">
        <span className={small ? 'text-xs' : 'text-sm sm:text-base font-bold'}>{card.rank}</span>
        <span className={small ? 'text-xs leading-none' : 'text-xs sm:text-sm leading-none'}>{symbol}</span>
      </div>

      {/* Center - large suit symbol */}
      <div className="flex-1 flex items-center justify-center relative z-10">
        <span className={small ? 'text-2xl' : 'text-3xl sm:text-4xl'}>{symbol}</span>
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className="absolute bottom-1 right-1.5 flex flex-col items-center leading-none rotate-180 z-10">
        <span className={small ? 'text-xs' : 'text-sm sm:text-base font-bold'}>{card.rank}</span>
        <span className={small ? 'text-xs leading-none' : 'text-xs sm:text-sm leading-none'}>{symbol}</span>
      </div>
    </button>
  );
}
