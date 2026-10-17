'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, CheckCircle2 } from 'lucide-react';
import { deletePushSubscription, savePushSubscription } from '@/app/actions';
import {
  VAPID_PUBLIC_KEY,
  getPushSubscription,
  isIos,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  waitForServiceWorker,
} from '@/lib/pwa-client';

type PushState =
  | 'loading'
  | 'unavailable' // navigateur sans push ou clés VAPID absentes
  | 'ios-install-first' // iPhone : le push n'existe que pour l'app installée
  | 'denied'
  | 'off'
  | 'on';

async function detectState(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) return 'unavailable';
  if (isIos() && !isStandalone()) return 'ios-install-first';
  if (!isPushSupported() || !(await waitForServiceWorker())) return 'unavailable';
  if (Notification.permission === 'denied') return 'denied';
  return (await getPushSubscription()) ? 'on' : 'off';
}

interface PushNotificationsToggleProps {
  // compact : n'affiche qu'une invitation à activer, et rien dans les autres cas.
  compact?: boolean;
}

/** Active / désactive les notifications push sur l'appareil courant. */
export default function PushNotificationsToggle({ compact = false }: PushNotificationsToggleProps) {
  const [state, setState] = useState<PushState>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectState().then(setState);
  }, []);

  const enable = async () => {
    setBusy(true);
    setError(null);
    try {
      // La demande d'autorisation doit suivre directement un geste de
      // l'utilisateur (exigence iOS).
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const subscription = await subscribeToPush();
      const result = await savePushSubscription(subscription.toJSON(), navigator.userAgent);
      if (!result.success) {
        await subscription.unsubscribe();
        setError(result.error);
        return;
      }
      setState('on');
    } catch (err) {
      console.error('Activation des notifications impossible:', err);
      setError("Impossible d'activer les notifications sur cet appareil.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setError(null);
    try {
      const subscription = await getPushSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('off');
    } catch {
      setError('Impossible de désactiver les notifications.');
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    if (state !== 'off') return null;
    return (
      <div className="flex items-center gap-3 border-b border-gray-100 bg-primary/5 px-4 py-3">
        <Bell className="h-5 w-5 flex-shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-sm text-gray-700">
          Reçois ces notifications directement sur ton téléphone.
        </p>
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="min-h-[40px] flex-shrink-0 rounded-xl bg-primary px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activer'}
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
  }

  return (
    <div className="space-y-2">
      {state === 'unavailable' && (
        <p className="text-sm text-gray-500">
          Les notifications ne sont pas disponibles sur ce navigateur.
        </p>
      )}

      {state === 'ios-install-first' && (
        <p className="text-sm text-gray-500">
          Sur iPhone, installe d&apos;abord l&apos;app sur l&apos;écran d&apos;accueil (voir
          ci-dessus), puis ouvre-la depuis son icône pour activer les notifications.
        </p>
      )}

      {state === 'denied' && (
        <p className="text-sm text-gray-500">
          Les notifications sont bloquées pour PerfConnect. Autorise-les dans les réglages de
          ton téléphone ou de ton navigateur, puis reviens ici.
        </p>
      )}

      {state === 'off' && (
        <>
          <p className="text-sm text-gray-500">
            Reçois une alerte pour les demandes de participation, les réponses, les messages et
            les sorties modifiées ou annulées.
          </p>
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-50 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Activer les notifications sur cet appareil
          </button>
        </>
      )}

      {state === 'on' && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Notifications activées sur cet appareil
          </p>
          <button
            type="button"
            onClick={disable}
            disabled={busy}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <BellOff className="h-4 w-4" />
            Désactiver
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
