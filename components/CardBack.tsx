'use client';

interface Props {
  onClick?: () => void;
  highlight?: boolean;
  small?: boolean;
}

export default function CardBack({ onClick, highlight, small }: Props) {
  const size = small ? 'w-12 h-16' : 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 lg:w-28 lg:h-36';

  return (
    <button
      onClick={onClick}
      className={`
        ${size} rounded-xl border-2 cursor-pointer transition-all duration-150 select-none overflow-hidden
        bg-gradient-to-br from-blue-950 via-blue-900 to-sky-900 flex items-center justify-center shadow-sm
        ${highlight
          ? 'border-yellow-400 hover:-translate-y-1 hover:shadow-lg'
          : 'border-blue-700 hover:border-blue-500 hover:-translate-y-0.5'
        }
      `}
    >
      <div className="w-full h-full p-1">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.22)_0,rgba(30,64,175,0.2)_18%,rgba(15,23,42,0)_19%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0)_45%,rgba(255,255,255,0.08))] flex items-center justify-center">
          <div className="relative w-9 h-12 sm:w-10 sm:h-14">
            <div className="absolute inset-x-1 top-1 h-2 rounded-full bg-blue-400/70" />
            <div className="absolute inset-x-1 bottom-1 h-2 rounded-full bg-blue-400/70" />
            <div className="absolute inset-y-1 left-1 w-2 rounded-full bg-blue-300/80" />
            <div className="absolute inset-y-1 right-1 w-2 rounded-full bg-blue-300/80" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-700/80 flex items-center justify-center">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
