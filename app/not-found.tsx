import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="mb-3 text-4xl">🧭</p>
      <h1 className="mb-2 text-xl font-bold text-gray-900">Page introuvable</h1>
      <p className="mb-6 max-w-xs text-sm text-gray-500">
        Cette page n&apos;existe pas ou la sortie a été supprimée.
      </p>
      <Link href="/" className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">
        Retour au fil
      </Link>
    </div>
  );
}
