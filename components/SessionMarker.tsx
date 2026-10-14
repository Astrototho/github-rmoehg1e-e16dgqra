'use client';

import { useEffect } from 'react';

// Mémorise sur l'appareil qu'une session a déjà existé : après expiration,
// l'écran de connexion affiche « Content de te revoir » au lieu de l'accueil.
export default function SessionMarker() {
  useEffect(() => {
    if (!document.cookie.includes('pc_had_session=1')) {
      document.cookie = 'pc_had_session=1; path=/; max-age=31536000; samesite=lax';
    }
  }, []);
  return null;
}
