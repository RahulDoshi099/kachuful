'use client';

import { useState } from 'react';
import { Card, Player, Suit } from '@/lib/types';
import CardBack from './CardBack';
import CardComponent from './CardComponent';

interface Props {
  player: Player;
  validCardIds: Set<string>;
  onPlayCard: (card: Card) => void;
  isActive: boolean;
  trumpSuit: Suit;
  handLabel: string;
}

// Sort cards by suit then rank
const SUIT_ORDER = { spades: 0, diamonds: 1, clubs: 2, hearts: 3 };
const RANK_ORDER = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

const TRUMP_META: Record<Suit, { label: string; symbol: string; className: string }> = {
  spades: { label: 'Spades', symbol: '♠', className: 'bg-slate-100 text-slate-950 border-slate-400' },
  diamonds: { label: 'Diamonds', symbol: '♦', className: 'bg-rose-50 text-rose-700 border-rose-400' },
  clubs: { label: 'Clubs', symbol: '♣', className: 'bg-slate-100 text-slate-950 border-slate-400' },
  hearts: { label: 'Hearts', symbol: '♥', className: 'bg-red-50 text-red-700 border-red-400' },
};

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  });
}

export default function MultiplayerHand({ player, validCardIds, onPlayCard, isActive, trumpSuit, handLabel }: Props) {
  // Track which individual cards are revealed
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(true);

  function toggleCard(cardId: string) {
    if (showAll) return; // when showAll, clicking plays the card instead
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  function toggleShowAll() {
    setShowAll((v) => {
      if (!v) setRevealedIds(new Set()); // clear individual reveals when showing all
      return !v;
    });
  }

  function handleCardClick(card: Card) {
    if (showAll) {
      // In show-all mode: if active, play the card; otherwise just a visual card
      if (isActive && validCardIds.has(card.id)) {
        onPlayCard(card);
      }
    } else {
      // Hidden mode: first click reveals, second click plays (if valid & active)
      if (revealedIds.has(card.id)) {
        if (isActive && validCardIds.has(card.id)) {
          onPlayCard(card);
        }
      } else {
        toggleCard(card.id);
      }
    }
  }

  const isRevealed = (cardId: string) => showAll || revealedIds.has(cardId);
  const sortedHand = sortCards(player.hand);
  const trumpMeta = TRUMP_META[trumpSuit];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 text-center">
        <span className="text-xs sm:text-sm font-semibold text-green-200 bg-green-900/60 px-3 py-1.5 rounded-full border border-green-700/60">
          {handLabel}
        </span>
        <div className={`inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border shadow-md ${trumpMeta.className}`}>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] opacity-70 font-medium">Trump</span>
            <span className="text-xs sm:text-sm font-bold">{trumpMeta.label}</span>
          </div>
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/80 border-2 border-white/90 shadow-md">
            <span className="text-2xl sm:text-3xl leading-none">{trumpMeta.symbol}</span>
          </div>
        </div>
        {player.bid !== null && (
          <span className="text-xs bg-green-800 px-2 py-1 rounded-full border border-green-700/60">
            Bid: {player.bid} · Tricks: {player.tricksTaken}
          </span>
        )}
        <button
          onClick={toggleShowAll}
          className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
            showAll
              ? 'bg-yellow-500 text-black'
              : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
        >
          {showAll ? '🙈 Hide All' : '👁 Show All'}
        </button>
        {!showAll && (
          <span className="text-xs text-green-500 italic">
            tap a card to peek · tap again to play
          </span>
        )}
        {!isActive && (
          <span className="text-xs text-green-500 italic">waiting for your turn...</span>
        )}
      </div>

      <div className="overflow-x-auto pb-3 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex gap-3 sm:gap-4 min-w-max sm:min-w-0 sm:flex-wrap justify-start sm:justify-center snap-x snap-mandatory">
          {sortedHand.map((card) => {
            const revealed = isRevealed(card.id);
            const isValid = isActive && validCardIds.has(card.id);

            return (
              <div key={card.id} className="relative snap-start">
                {revealed ? (
                  <CardComponent
                    card={card}
                    isValid={isValid}
                    onClick={() => handleCardClick(card)}
                  />
                ) : (
                  <CardBack
                    onClick={() => handleCardClick(card)}
                    highlight={isActive}
                  />
                )}
                {!showAll && revealedIds.has(card.id) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
                )}
              </div>
            );
          })}

          {player.hand.length === 0 && (
            <span className="text-green-600 text-sm italic">No cards</span>
          )}
        </div>
      </div>
    </div>
  );
}
