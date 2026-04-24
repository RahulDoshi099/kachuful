import { Card, GameState, Player, Rank, Suit, Trick } from './types';

const SUITS: Suit[] = ['spades', 'diamonds', 'clubs', 'hearts'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUE: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const TRUMP_PATTERN: Suit[] = ['spades', 'diamonds', 'clubs', 'hearts'];

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getInitialHandSize(playerCount: number): number {
  // Max cards per player = floor(52 / playerCount), capped at 10
  const maxPossible = Math.floor(52 / playerCount);
  return Math.min(maxPossible, 10);
}

export function buildHandSizes(initial: number): number[] {
  const down = Array.from({ length: initial }, (_, i) => initial - i);
  const up = Array.from({ length: initial - 1 }, (_, i) => i + 2);
  return [...down, ...up];
}

export function dealHand(state: GameState): GameState {
  const deck = shuffle(buildDeck());
  const handSize = state.handSizes[state.currentHandIndex];
  const players = state.players.map((p, i) => ({
    ...p,
    hand: deck.slice(i * handSize, (i + 1) * handSize),
    bid: null,
    tricksTaken: 0,
  }));
  const trumpSuit = TRUMP_PATTERN[state.currentHandIndex % 4];
  // bidding starts left of dealer
  const firstBidder = (state.dealerIndex + 1) % state.players.length;
  const biddingOrder = Array.from({ length: state.players.length }, (_, i) =>
    state.players[(firstBidder + i) % state.players.length].id
  );
  return {
    ...state,
    players,
    deck,
    currentHandSize: handSize,
    trumpSuit,
    currentTrick: { cards: [], leadSuit: null, winnerId: null },
    completedTricks: [],
    phase: 'bidding',
    biddingOrder,
    biddingIndex: 0,
    currentPlayerIndex: firstBidder,
  };
}

export function placeBid(state: GameState, playerId: string, bid: number): GameState {
  console.log('placeBid called:', { playerId, bid, biddingIndex: state.biddingIndex, phase: state.phase });
  
  const dealerId = state.players[state.dealerIndex].id;
  const isDealer = playerId === dealerId;
  const totalBidsSoFar = state.players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
  const remainingBidders = state.biddingOrder.length - state.biddingIndex - 1;

  // Dealer hook: cannot make total bids equal tricks available
  if (isDealer) {
    const forbidden = state.currentHandSize - totalBidsSoFar;
    if (bid === forbidden) {
      console.log('Invalid bid - dealer hook violation');
      return state; // invalid bid
    }
  }

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, bid } : p
  );
  const nextBiddingIndex = state.biddingIndex + 1;
  const doneWithBidding = nextBiddingIndex >= state.biddingOrder.length;

  console.log('Bid placed:', { nextBiddingIndex, doneWithBidding, totalPlayers: state.biddingOrder.length });

  if (doneWithBidding) {
    // Play starts left of dealer
    const firstPlayer = (state.dealerIndex + 1) % state.players.length;
    console.log('Bidding complete, starting play phase');
    return {
      ...state,
      players,
      biddingIndex: nextBiddingIndex,
      phase: 'playing',
      currentPlayerIndex: firstPlayer,
      currentTrick: { cards: [], leadSuit: null, winnerId: null },
    };
  }

  const nextBidderId = state.biddingOrder[nextBiddingIndex];
  const nextPlayerIndex = state.players.findIndex((p) => p.id === nextBidderId);
  console.log('Next bidder:', { nextBidderId, nextPlayerIndex });
  
  return {
    ...state,
    players,
    biddingIndex: nextBiddingIndex,
    currentPlayerIndex: nextPlayerIndex,
  };
}

export function getValidBids(state: GameState, playerId: string): number[] {
  const dealerId = state.players[state.dealerIndex].id;
  const isDealer = playerId === dealerId;
  const totalBidsSoFar = state.players.reduce((sum, p) => sum + (p.bid ?? 0), 0);
  const forbidden = isDealer ? state.currentHandSize - totalBidsSoFar : -1;
  return Array.from({ length: state.currentHandSize + 1 }, (_, i) => i).filter(
    (b) => b !== forbidden
  );
}

export function playCard(state: GameState, playerId: string, card: Card): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const newHand = player.hand.filter((c) => c.id !== card.id);
  const leadSuit = state.currentTrick.leadSuit ?? card.suit;
  const newTrickCards = [...state.currentTrick.cards, { playerId, card }];
  const newTrick: Trick = { ...state.currentTrick, cards: newTrickCards, leadSuit };

  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, hand: newHand } : p
  );

  const trickComplete = newTrickCards.length === state.players.length;

  if (!trickComplete) {
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return { ...state, players, currentTrick: newTrick, currentPlayerIndex: nextIndex };
  }

  // Trick complete — resolve winner but pause in trickReveal phase so UI can show it
  const winnerId = resolveTrick(newTrick, state.trumpSuit);
  const resolvedTrick: Trick = { ...newTrick, winnerId };
  const updatedPlayers = players.map((p) =>
    p.id === winnerId ? { ...p, tricksTaken: p.tricksTaken + 1 } : p
  );
  const winnerIndex = updatedPlayers.findIndex((p) => p.id === winnerId);

  return {
    ...state,
    players: updatedPlayers,
    currentTrick: resolvedTrick,
    currentPlayerIndex: winnerIndex,
    phase: 'trickReveal',
  };
}

// Called after the reveal delay to advance to next trick or round end
export function advanceTrick(state: GameState): GameState {
  const completedTricks = [...state.completedTricks, state.currentTrick];
  const winnerIndex = state.currentPlayerIndex;
  const allTricksPlayed = state.players[0].hand.length === 0;

  if (allTricksPlayed) {
    const scoredPlayers = state.players.map((p) => ({
      ...p,
      score: p.score + calcRoundScore(p),
    }));
    return {
      ...state,
      players: scoredPlayers,
      completedTricks,
      phase: 'roundEnd',
    };
  }

  return {
    ...state,
    currentTrick: { cards: [], leadSuit: null, winnerId: null },
    completedTricks,
    phase: 'playing',
    currentPlayerIndex: winnerIndex,
  };
}

export function resolveTrick(trick: Trick, trumpSuit: Suit): string {
  const leadSuit = trick.leadSuit!;
  let winner = trick.cards[0];
  for (const entry of trick.cards.slice(1)) {
    if (beats(entry.card, winner.card, leadSuit, trumpSuit)) {
      winner = entry;
    }
  }
  return winner.playerId;
}

function beats(challenger: Card, current: Card, leadSuit: Suit, trumpSuit: Suit): boolean {
  const cIsTrump = challenger.suit === trumpSuit;
  const wIsTrump = current.suit === trumpSuit;
  if (cIsTrump && !wIsTrump) return true;
  if (!cIsTrump && wIsTrump) return false;
  if (challenger.suit === current.suit) return RANK_VALUE[challenger.rank] > RANK_VALUE[current.rank];
  // challenger not trump, not same suit as current winner — doesn't beat
  if (challenger.suit !== leadSuit && current.suit === leadSuit) return false;
  if (challenger.suit === leadSuit && current.suit !== leadSuit) return true;
  return RANK_VALUE[challenger.rank] > RANK_VALUE[current.rank];
}

export function calcRoundScore(player: Player): number {
  if (player.bid === null) return 0;
  if (player.tricksTaken === player.bid) return 10 + player.bid;
  return 0;
}

export function getValidCards(state: GameState, playerId: string): Card[] {
  const player = state.players.find((p) => p.id === playerId)!;
  const leadSuit = state.currentTrick.leadSuit;
  if (!leadSuit || state.currentTrick.cards.length === 0) return player.hand;
  const suitCards = player.hand.filter((c) => c.suit === leadSuit);
  return suitCards.length > 0 ? suitCards : player.hand;
}

export function advanceRound(state: GameState): GameState {
  const nextHandIndex = state.currentHandIndex + 1;
  if (nextHandIndex >= state.handSizes.length) {
    return { ...state, phase: 'gameOver' };
  }
  const nextDealerIndex = (state.dealerIndex + 1) % state.players.length;
  return dealHand({
    ...state,
    currentHandIndex: nextHandIndex,
    dealerIndex: nextDealerIndex,
  });
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameOver';
}

// Simple AI: bid based on high cards + trumps, play highest valid card
export function aiBid(state: GameState, playerId: string): number {
  const player = state.players.find((p) => p.id === playerId)!;
  const trumps = player.hand.filter((c) => c.suit === state.trumpSuit);
  const highCards = player.hand.filter(
    (c) => RANK_VALUE[c.rank] >= 12 && c.suit !== state.trumpSuit
  );
  const estimate = Math.min(trumps.length + Math.floor(highCards.length / 2), state.currentHandSize);
  const valid = getValidBids(state, playerId);
  if (valid.includes(estimate)) return estimate;
  // pick closest valid bid
  return valid.reduce((prev, curr) =>
    Math.abs(curr - estimate) < Math.abs(prev - estimate) ? curr : prev
  );
}

export function aiPlayCard(state: GameState, playerId: string): Card {
  const valid = getValidCards(state, playerId);
  const player = state.players.find((p) => p.id === playerId)!;
  const needed = (player.bid ?? 0) - player.tricksTaken;
  const leadSuit = state.currentTrick.leadSuit;

  if (needed <= 0) {
    // Try to lose — play lowest card
    return valid.sort((a, b) => RANK_VALUE[a.rank] - RANK_VALUE[b.rank])[0];
  }
  // Try to win — play highest trump if available, else highest of lead suit
  const trumps = valid.filter((c) => c.suit === state.trumpSuit);
  if (trumps.length > 0) return trumps.sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank])[0];
  return valid.sort((a, b) => RANK_VALUE[b.rank] - RANK_VALUE[a.rank])[0];
}

export function createInitialState(playerNames: string[], playerTypes: ('human' | 'ai')[], playerIds?: string[]): GameState {
  const players: Player[] = playerNames.map((name, i) => ({
    id: playerIds?.[i] ?? `player-${i}`,
    name,
    type: playerTypes[i],
    hand: [],
    bid: null,
    tricksTaken: 0,
    score: 0,
  }));
  const initialHandSize = getInitialHandSize(players.length);
  const handSizes = buildHandSizes(initialHandSize);
  const dealerIndex = Math.floor(Math.random() * players.length);
  const base: GameState = {
    players,
    deck: [],
    currentHandSize: initialHandSize,
    handSizes,
    currentHandIndex: 0,
    trumpSuit: TRUMP_PATTERN[0],
    trumpPattern: TRUMP_PATTERN,
    dealerIndex,
    currentPlayerIndex: 0,
    phase: 'setup',
    currentTrick: { cards: [], leadSuit: null, winnerId: null },
    completedTricks: [],
    targetScore: 100,
    biddingOrder: [],
    biddingIndex: 0,
  };
  return dealHand(base);
}
