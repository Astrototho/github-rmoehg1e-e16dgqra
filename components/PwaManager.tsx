'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { initInstallPromptCapture } from '@/lib/pwa-client';

// Version de ce build (identifiant du commit sur Vercel), injectée par
// next.config.mjs. /api/version renvoie celle du build actuellement en ligne.
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
const VERSION_CHECK_INTERVAL_MS = 10 * 60 * 1000;

// Le service worker n'est actif qu'en production : en développement, il
// risquerait de servir des fichiers périmés pendant qu'on modifie le code.
const SW_ENABLED =
  process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

initInstallPromptCapture();

/**
 * Enregistre le service worker et prévient l'utilisateur quand une nouvelle
 * version a été déployée pendant que l'app restait ouverte (fréquent avec une
 * app installée sur l'écran d'accueil, gardée en mémoire des jours entiers).
 */
export default function PwaManager() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (SW_ENABLED) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
        console.error('Enregistrement du service worker impossible:', err);
      });
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (APP_VERSION === 'dev') return;

    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version?: string };
        if (version && version !== APP_VERSION) setUpdateAvailable(true);
      } catch {
        // Hors connexion : on réessaiera plus tard.
      }
    };

    const interval = setInterval(check, VERSION_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[70] mx-auto w-full max-w-md px-3 pt-safe">
      <div
        role="status"
        className="mt-2 flex items-center gap-3 rounded-2xl bg-navy-900 px-4 py-3 text-white shadow-xl"
      >
        <p className="flex-1 text-sm">Une nouvelle version de PerfConnect est disponible.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          Mettre à jour
        </button>
      </div>
    </div>
  );
}
