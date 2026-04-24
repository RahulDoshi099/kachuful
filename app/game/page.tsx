'use client';

import { useEffect, useReducer, useCallback } from 'react';
import { GameState, Card } from '@/lib/types';
import {
  createInitialState,
  placeBid,
  playCard,
  advanceRound,
  getValidBids,
  getValidCards,
  aiBid,
  aiPlayCard,
} from '@/lib/gameEngine';
import ScoreBoard from '@/components/ScoreBoard';
import MultiplayerHand from '@/components/MultiplayerHand';
import TrickArea from '@/components/TrickArea';
import BiddingPanel from '@/components/BiddingPanel';
import GameOverScreen from '@/components/GameOverScreen';
import RoundSummary from '@/components/RoundSummary';

type Action =
  | { type: 'BID'; playerId: string; bid: number }
  | { type: 'PLAY_CARD'; playerId: string; card: Card }
  | { type: 'NEXT_ROUND' }
  | { type: 'RESET' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'BID':
      return placeBid(state, action.playerId, action.bid);
    case 'PLAY_CARD':
      return playCard(state, action.playerId, action.card);
    case 'NEXT_ROUND':
      return advanceRound(state);
    case 'RESET':
      return createInitialState(
        state.players.map((p) => p.name),
        state.players.map((p) => p.type)
      );
    default:
      return state;
  }
}

const HUMAN_ID = 'player-0';

export default function GamePage() {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => createInitialState(['You', 'Alice', 'Bob', 'Carol'], ['human', 'ai', 'ai', 'ai'])
  );

  const currentPlayer = state.players[state.currentPlayerIndex];
  const humanPlayer = state.players.find((p) => p.id === HUMAN_ID)!;
  const isHumanTurn = currentPlayer?.id === HUMAN_ID;

  // AI automation
  useEffect(() => {
    if (state.phase === 'bidding' && !isHumanTurn) {
      const timer = setTimeout(() => {
        const bid = aiBid(state, currentPlayer.id);
        dispatch({ type: 'BID', playerId: currentPlayer.id, bid });
      }, 600);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'playing' && !isHumanTurn) {
      const timer = setTimeout(() => {
        const card = aiPlayCard(state, currentPlayer.id);
        dispatch({ type: 'PLAY_CARD', playerId: currentPlayer.id, card });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [state, isHumanTurn, currentPlayer]);

  const handleBid = useCallback((bid: number) => {
    dispatch({ type: 'BID', playerId: HUMAN_ID, bid });
  }, []);

  const handlePlayCard = useCallback((card: Card) => {
    if (!isHumanTurn || state.phase !== 'playing') return;
    const valid = getValidCards(state, HUMAN_ID);
    if (!valid.find((c) => c.id === card.id)) return;
    dispatch({ type: 'PLAY_CARD', playerId: HUMAN_ID, card });
  }, [state, isHumanTurn]);

  if (state.phase === 'gameOver') {
    return <GameOverScreen players={state.players} onReset={() => dispatch({ type: 'RESET' })} />;
  }

  const validCards = state.phase === 'playing' && isHumanTurn
    ? getValidCards(state, HUMAN_ID)
    : [];

  const validCardIds = new Set(validCards.map((c) => c.id));

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-green-950 shadow">
        <h1 className="text-xl font-bold tracking-wide">Kachuful</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="bg-green-800 px-3 py-1 rounded-full">
            Hand {state.currentHandIndex + 1}/{state.handSizes.length} — {state.currentHandSize} cards
          </span>
          <span className="bg-yellow-700 px-3 py-1 rounded-full capitalize flex items-center gap-1">
            Trump: {state.trumpSuit === 'spades' && '♠'}
            {state.trumpSuit === 'hearts' && '♥'}
            {state.trumpSuit === 'diamonds' && '♦'}
            {state.trumpSuit === 'clubs' && '♣'}
            <span className="ml-1">{state.trumpSuit}</span>
          </span>
        </div>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="text-xs bg-red-700 hover:bg-red-600 px-3 py-1 rounded"
        >
          New Game
        </button>
      </div>

      <div className="flex flex-1 gap-4 p-4">
        {/* Left: Scoreboard */}
        <div className="w-48 shrink-0">
          <ScoreBoard
            players={state.players}
            dealerIndex={state.dealerIndex}
            currentPlayerIndex={state.currentPlayerIndex}
            phase={state.phase}
          />
        </div>

        {/* Center: Game area */}
        <div className="flex-1 flex flex-col gap-4">
          <TrickArea
            trick={state.currentTrick}
            players={state.players}
            trumpSuit={state.trumpSuit}
            tricksPlayed={state.completedTricks.length}
            totalTricks={state.currentHandSize}
          />

          {state.phase === 'roundEnd' && (
            <RoundSummary
              players={state.players}
              onContinue={() => dispatch({ type: 'NEXT_ROUND' })}
            />
          )}

          {state.phase === 'bidding' && isHumanTurn && (
            <BiddingPanel
              validBids={getValidBids(state, HUMAN_ID)}
              handSize={state.currentHandSize}
              onBid={handleBid}
            />
          )}

          {state.phase === 'bidding' && !isHumanTurn && (
            <div className="text-center text-green-300 animate-pulse py-4">
              {currentPlayer.name} is thinking...
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Human hand */}
      <div className="bg-green-950 px-4 py-3">
          <MultiplayerHand
            player={humanPlayer}
            validCardIds={validCardIds}
            onPlayCard={handlePlayCard}
            isActive={isHumanTurn && state.phase === 'playing'}
          />
        </div>
    </div>
  );
}
