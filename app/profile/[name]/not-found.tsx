import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 px-6 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">🔍</div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          ENS Name Not Found
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          The ENS name you&apos;re looking for doesn&apos;t exist or couldn&apos;t be resolved on the Ethereum blockchain.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
        >
          ← Back to Search
        </Link>
      </div>
    </div>
  );
}

