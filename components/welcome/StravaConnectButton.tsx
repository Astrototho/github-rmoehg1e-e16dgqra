'use client';

import { useFormStatus } from 'react-dom';

// Bouton « Se connecter avec Strava » aux couleurs des règles de marque
// Strava (orange #FC5200, logo blanc, jamais animé). Si le fichier officiel
// du pack Strava est ajouté dans public/strava/, il peut remplacer ce rendu.
export default function StravaConnectButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        type="submit"
        disabled={pending}
        className={`mx-auto flex h-12 w-full max-w-xs items-center justify-center gap-3 rounded-[4px] bg-[#FC5200] px-6 text-[15px] font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-900 ${
          pending ? 'opacity-60' : ''
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.912-11.724h-3.066m-11.4-11.2L11.566 13.22h3.065L7.665 0 1.753 11.724h3.066" />
        </svg>
        Se connecter avec Strava
      </button>
      <p aria-live="polite" className="mt-2 h-4 text-center text-xs text-gray-600">
        {pending ? 'Ouverture de Strava…' : 'Un seul clic. Pas de mot de passe, pas de formulaire.'}
      </p>
    </>
  );
}
