'use client';

import { useState } from 'react';
import { Card, Player } from '@/lib/types';
import CardBack from './CardBack';
import CardComponent from './CardComponent';

interface Props {
  player: Player;
  validCardIds: Set<string>;
  onPlayCard: (card: Card) => void;
  isActive: boolean;
}

// Sort cards by suit then rank
const SUIT_ORDER = { spades: 0, diamonds: 1, clubs: 2, hearts: 3 };
const RANK_ORDER = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };

function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const suitDiff = SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    if (suitDiff !== 0) return suitDiff;
    return RANK_ORDER[a.rank] - RANK_ORDER[b.rank];
  });
}

export default function MultiplayerHand({ player, validCardIds, onPlayCard, isActive }: Props) {
  // Track which individual cards are revealed
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-center gap-3 mb-2">
        <span className="text-sm font-semibold text-green-300">Your Hand</span>
        {player.bid !== null && (
          <span className="text-xs bg-green-800 px-2 py-0.5 rounded-full">
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

      <div className="flex gap-2 flex-wrap justify-center">
        {sortedHand.map((card) => {
          const revealed = isRevealed(card.id);
          const isValid = isActive && validCardIds.has(card.id);

          return (
            <div key={card.id} className="relative">
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
              {/* Peek indicator */}
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
  );
}
