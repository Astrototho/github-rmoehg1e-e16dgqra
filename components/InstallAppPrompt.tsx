'use client';

import { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, CheckCircle2 } from 'lucide-react';
import {
  canPromptInstall,
  isIos,
  isStandalone,
  onInstallPromptChange,
  promptInstall,
} from '@/lib/pwa-client';

const DISMISS_KEY = 'perfconnect-install-dismissed-at';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

type Platform = 'installed' | 'prompt' | 'ios' | 'unsupported';

function detectPlatform(): Platform {
  if (isStandalone()) return 'installed';
  if (canPromptInstall()) return 'prompt';
  if (isIos()) return 'ios';
  return 'unsupported';
}

function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_DURATION_MS;
  } catch {
    return false;
  }
}

interface InstallAppPromptProps {
  // banner : encart refermable sur le fil ; card : bloc permanent (Paramètres).
  variant: 'banner' | 'card';
}

/** Propose d'installer PerfConnect sur l'écran d'accueil du téléphone. */
export default function InstallAppPrompt({ variant }: InstallAppPromptProps) {
  // null tant que le composant n'est pas monté : rien n'est rendu côté serveur.
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());
    setDismissed(variant === 'banner' && wasDismissedRecently());
    return onInstallPromptChange(() => setPlatform(detectPlatform()));
  }, [variant]);

  if (platform === null) return null;

  if (variant === 'banner') {
    if (dismissed || platform === 'installed' || platform === 'unsupported') return null;

    const dismiss = () => {
      setDismissed(true);
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        // Stockage indisponible (navigation privée) : l'encart reviendra.
      }
    };

    return (
      <div className="relative flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 pr-11">
        <Download className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-gray-900">
            Installe PerfConnect sur ton téléphone
          </p>
          {platform === 'prompt' ? (
            <button
              type="button"
              onClick={() => promptInstall()}
              className="min-h-[40px] rounded-xl bg-primary px-4 text-sm font-bold text-white"
            >
              Installer l&apos;app
            </button>
          ) : (
            <IosInstructions />
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Masquer"
          className="absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Variante "card" (Paramètres)
  if (platform === 'installed') {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Application installée sur cet appareil
      </p>
    );
  }
  if (platform === 'prompt') {
    return (
      <button
        type="button"
        onClick={() => promptInstall()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-sm font-semibold text-primary hover:bg-primary/20"
      >
        <Download className="h-4 w-4" />
        Installer l&apos;app sur l&apos;écran d&apos;accueil
      </button>
    );
  }
  if (platform === 'ios') return <IosInstructions />;
  return (
    <p className="text-sm text-gray-500">
      Ouvre PerfConnect dans Chrome (Android) ou Safari (iPhone) pour l&apos;installer sur
      l&apos;écran d&apos;accueil.
    </p>
  );
}

function IosInstructions() {
  return (
    <ol className="space-y-1.5 text-sm text-gray-700">
      <li className="flex flex-wrap items-center gap-1.5">
        1. Dans Safari, touche
        <Share className="h-4 w-4 text-primary" aria-label="Partager" />
        <span className="font-semibold">Partager</span>
      </li>
      <li className="flex flex-wrap items-center gap-1.5">
        2. Choisis
        <PlusSquare className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="font-semibold">Sur l&apos;écran d&apos;accueil</span>
      </li>
    </ol>
  );
}
