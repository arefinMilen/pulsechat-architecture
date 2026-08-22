import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-white p-4">
      <h2 className="text-4xl font-extrabold text-indigo-400 mb-2">404 - Page Not Found</h2>
      <p className="text-gray-400 text-sm mb-6">The requested resource could not be found.</p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg transition-all"
      >
        Return to Home
      </Link>
    </div>
  );
}
