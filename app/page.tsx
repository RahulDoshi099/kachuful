import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center text-white px-4 py-8">
      <div className="text-center w-full max-w-md">
        <h1 className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4">🃏 Kachuful</h1>
        <p className="text-green-300 text-base sm:text-lg mb-6 sm:mb-8 max-w-sm mx-auto">
          A trick-taking card game. Bid exactly right to score — too many or too few and you get nothing.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/lobby"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg transition-colors w-full sm:w-52 text-center"
          >
            Multiplayer
          </Link>
          <Link
            href="/game"
            className="bg-green-700 hover:bg-green-600 text-white font-bold px-6 sm:px-8 py-3 rounded-xl text-base sm:text-lg transition-colors w-full sm:w-52 text-center"
          >
            vs AI
          </Link>
        </div>
      </div>
    </div>
  );
}
