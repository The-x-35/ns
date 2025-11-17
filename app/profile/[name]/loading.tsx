export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 via-white to-purple-50 px-6 dark:from-gray-900 dark:via-black dark:to-purple-950">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Loading ENS profile...
        </p>
      </div>
    </div>
  );
}

