'use client';

interface Props {
  validBids: number[];
  handSize: number;
  onBid: (bid: number) => void;
}

export default function BiddingPanel({ validBids, handSize, onBid }: Props) {
  return (
    <div className="bg-green-800 rounded-xl p-4 text-center">
      <p className="text-sm text-green-300 mb-3 font-semibold">
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
                w-10 h-10 rounded-lg font-bold text-sm transition-all
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
