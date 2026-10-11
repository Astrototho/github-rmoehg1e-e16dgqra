'use client';

// Outils PWA côté navigateur : détection de la plateforme, invite
// d'installation Android/Chrome, abonnement aux notifications push.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// -----------------------------------------------------------------------------
// Plateforme
// -----------------------------------------------------------------------------

/** App lancée depuis l'écran d'accueil (et non dans un onglet de navigateur). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    // iPadOS se présente comme un Mac avec écran tactile.
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  );
}

// -----------------------------------------------------------------------------
// Invite d'installation (Android / Chrome / Edge)
// -----------------------------------------------------------------------------

// L'événement beforeinstallprompt arrive tôt, parfois avant le montage des
// composants qui en ont besoin : il est capturé une fois pour toute l'app.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

export function initInstallPromptCapture() {
  if (typeof window === 'undefined') return;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((l) => l());
  });
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

export function onInstallPromptChange(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  listeners.forEach((l) => l());
  return outcome === 'accepted';
}

// -----------------------------------------------------------------------------
// Notifications push
// -----------------------------------------------------------------------------

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Service worker actif, ou null s'il n'y en a pas (par exemple en
 * développement, où il est désactivé) au bout de `timeoutMs`.
 */
export async function waitForServiceWorker(
  timeoutMs = 4000
): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  const registration = await waitForServiceWorker();
  return (await registration?.pushManager.getSubscription()) ?? null;
}

export async function subscribeToPush(): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
  });
}
