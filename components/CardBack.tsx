'use client';

interface Props {
  onClick?: () => void;
  highlight?: boolean;
  small?: boolean;
}

export default function CardBack({ onClick, highlight, small }: Props) {
  const size = small ? 'w-12 h-16' : 'w-16 h-24';

  return (
    <button
      onClick={onClick}
      className={`
        ${size} rounded-lg border-2 cursor-pointer transition-all duration-150 select-none
        bg-blue-900 flex items-center justify-center
        ${highlight
          ? 'border-yellow-400 hover:-translate-y-1 hover:shadow-lg'
          : 'border-blue-700 hover:border-blue-500 hover:-translate-y-0.5'
        }
      `}
    >
      {/* Card back pattern */}
      <div className="w-full h-full rounded-md p-1 flex items-center justify-center">
        <div className="w-full h-full rounded border border-blue-600 flex items-center justify-center">
          <span className="text-blue-400 text-lg">🂠</span>
        </div>
      </div>
    </button>
  );
}
