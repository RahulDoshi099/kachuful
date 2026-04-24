import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-green-900 flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">🃏 Kachuful</h1>
        <p className="text-green-300 text-lg mb-8 max-w-sm">
          A trick-taking card game. Bid exactly right to score — too many or too few and you get nothing.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <Link
            href="/lobby"
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl text-lg transition-colors w-48 text-center"
          >
            Multiplayer
          </Link>
          <Link
            href="/game"
            className="bg-green-700 hover:bg-green-600 text-white font-bold px-8 py-3 rounded-xl text-lg transition-colors w-48 text-center"
          >
            vs AI
          </Link>
        </div>
      </div>
    </div>
  );
}
