'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <AlertTriangle className="mb-4 h-10 w-10 text-amber-500" />
      <h1 className="mb-2 text-xl font-bold text-gray-900">
        Oups, quelque chose s&apos;est mal passé
      </h1>
      <p className="mb-6 max-w-xs text-sm text-gray-500">
        Vérifie ta connexion internet puis réessaie.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
