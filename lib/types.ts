export type Suit = 'spades' | 'diamonds' | 'clubs' | 'hearts';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string;
}

export type PlayerType = 'human' | 'ai';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  hand: Card[];
  bid: number | null;
  tricksTaken: number;
  score: number;
}

export interface Trick {
  cards: { playerId: string; card: Card }[];
  leadSuit: Suit | null;
  winnerId: string | null;
}

export type GamePhase = 'setup' | 'bidding' | 'playing' | 'trickReveal' | 'roundEnd' | 'gameOver';

export interface GameState {
  players: Player[];
  deck: Card[];
  currentHandSize: number;
  handSizes: number[];
  currentHandIndex: number;
  trumpSuit: Suit;
  trumpPattern: Suit[];
  dealerIndex: number;
  currentPlayerIndex: number;
  phase: GamePhase;
  currentTrick: Trick;
  completedTricks: Trick[];
  targetScore: number;
  biddingOrder: string[]; // player ids in bidding order
  biddingIndex: number;
}
