-- -----------------------------------------------------------------------------
-- Matching v2 : rythme corrigé du dénivelé, profil de terrain et capacité
-- (P90) par famille de sport.
-- Migration purement additive (compatible avec le code v1 encore en ligne) :
-- - les profils v1 sont ignorés par le code v2 puis purgés (durée de vie de
--   48 h des données dérivées de Strava, gérée par l'application) ;
-- - strava_tokens.profile_version déclenche un recalcul v2 à la prochaine
--   visite de chaque utilisateur, sans attendre le délai de 24 h.
-- -----------------------------------------------------------------------------

ALTER TABLE public.performance_profiles
  ADD COLUMN IF NOT EXISTS effort_speed_kmh numeric,
  ADD COLUMN IF NOT EXISTS climb_m_per_km numeric,
  ADD COLUMN IF NOT EXISTS p90_effort_km numeric,
  ADD COLUMN IF NOT EXISTS p90_elevation_gain_m numeric;

CREATE INDEX IF NOT EXISTS idx_performance_profiles_computed_at
  ON public.performance_profiles(computed_at);

ALTER TABLE public.strava_tokens
  ADD COLUMN IF NOT EXISTS profile_version text;
