'use client';

interface Props {
  validBids: number[];
  handSize: number;
  onBid: (bid: number) => void;
  trumpSuit?: string;
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

export default function BiddingPanel({ validBids, handSize, onBid, trumpSuit }: Props) {
  const trumpSymbol = trumpSuit ? SUIT_SYMBOLS[trumpSuit] : null;
  const trumpColor = trumpSuit ? SUIT_COLORS[trumpSuit] : '';
  const trumpBgColor = trumpSuit === 'hearts' || trumpSuit === 'diamonds'
    ? 'bg-red-100 border-red-300'
    : 'bg-gray-100 border-gray-300';

  return (
    <div className="bg-green-800 rounded-xl p-3 sm:p-4 text-center">
      {trumpSuit && (
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="text-xs sm:text-sm text-green-300 font-semibold">TRUMP:</span>
          <div className={`w-12 h-16 sm:w-14 sm:h-20 rounded-lg border-2 ${trumpBgColor} flex items-center justify-center shadow-md`}>
            <span className={`text-3xl sm:text-4xl font-bold ${trumpColor}`}>
              {trumpSymbol}
            </span>
          </div>
        </div>
      )}
      <p className="text-xs sm:text-sm text-green-300 mb-3 font-semibold">
        How many tricks will you take? ({handSize} cards dealt)
      </p>
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from({ length: handSize + 1 }, (_, i) => i).map((bid) => {
          const isValid = validBids.includes(bid);
          return (
            <button
              key={bid}
              onClick={() => isValid && onBid(bid)}
              disabled={!isValid}
              className={`
                w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm transition-all
                ${isValid
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer'
                  : 'bg-green-700 text-green-500 cursor-not-allowed opacity-50'
                }
              `}
            >
              {bid}
            </button>
          );
        })}
      </div>
      {validBids.length < handSize + 1 && (
        <p className="text-xs text-yellow-400 mt-2">
          * One bid is forbidden (dealer hook — total bids can&apos;t equal tricks available)
        </p>
      )}
    </div>
  );
}
