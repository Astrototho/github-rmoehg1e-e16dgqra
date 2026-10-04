-- =============================================================================
-- PERFCONNECT — Coordonnées de localisation sur le profil
-- Permet de choisir manuellement sa ville (autocomplétion) plutôt que de
-- dépendre uniquement de la ville renvoyée par Strava à la connexion.
-- Prépare aussi un futur filtre de proximité géographique.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
