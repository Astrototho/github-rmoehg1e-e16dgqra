'use client';

import { useFormStatus } from 'react-dom';

// Bouton officiel « Connect with Strava » (public/strava/, pack de marque
// Strava) : ni modifié ni animé, conformément aux règles de marque.
export default function StravaConnectButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className={`mx-auto block rounded-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900 ${
          pending ? 'opacity-60' : ''
        }`}
      >
        {/* Bouton officiel du pack de marque Strava, non modifié. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/strava/btn_strava_connect_with_orange.svg"
          alt="Se connecter avec Strava"
          width={237}
          height={48}
          className="h-12 w-auto"
        />
      </button>
      <p aria-live="polite" className="mt-2 h-4 text-center text-xs text-gray-600">
        {pending ? 'Ouverture de Strava…' : 'Un seul clic. Pas de mot de passe, pas de formulaire.'}
      </p>
    </>
  );
}
