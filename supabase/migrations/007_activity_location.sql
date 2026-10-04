-- =============================================================================
-- PERFCONNECT — Coordonnées du point de rendez-vous d'une sortie
-- Permet de calculer la distance entre la ville d'un utilisateur et le lieu
-- de RDV d'une sortie, affichée à côté du pourcentage de matching.
-- =============================================================================

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;
