-- =============================================================================
-- PERFCONNECT — Rafraîchissement périodique du profil de performance
-- =============================================================================

-- Date de la dernière tentative de recalcul du profil de performance (même si
-- elle n'a produit aucune ligne, faute d'activités suffisantes) : évite de
-- rappeler l'API Strava à chaque page vue. Les tokens eux-mêmes sont désormais
-- chiffrés côté application (AES-256-GCM, préfixe "v1.").
ALTER TABLE public.strava_tokens
  ADD COLUMN IF NOT EXISTS last_profile_refresh_at timestamptz;
