-- =============================================================================
-- PERFCONNECT — Durcissement sécurité + réduction à 4 sports
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Alertes du Security Advisor Supabase
-- -----------------------------------------------------------------------------

-- search_path figé : la fonction ne peut plus être détournée par un objet
-- homonyme créé dans un autre schéma.
ALTER FUNCTION public.set_updated_at() SET search_path = '';

-- Fonction d'event trigger (activation automatique du RLS) : elle n'a pas à
-- être appelable via l'API REST (/rest/v1/rpc/rls_auto_enable).
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Sports : trail, course à pied, vélo route, VTT (le "vélo" générique disparaît)
-- -----------------------------------------------------------------------------

UPDATE public.activities SET type = 'velo-route' WHERE type = 'velo';

-- Les profils "velo" seront recalculés (sorties Ride → velo-route) au prochain
-- rafraîchissement du profil de performance.
DELETE FROM public.performance_profiles WHERE sport_family = 'velo';

ALTER TABLE public.performance_profiles
  DROP CONSTRAINT IF EXISTS performance_profiles_sport_family_check;
ALTER TABLE public.performance_profiles
  ADD CONSTRAINT performance_profiles_sport_family_check
  CHECK (sport_family IN ('trail', 'course-a-pied', 'velo-route', 'vtt'));

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE public.activities
  ADD CONSTRAINT activities_type_check
  CHECK (type IN ('trail', 'course-a-pied', 'velo-route', 'vtt'));

-- -----------------------------------------------------------------------------
-- Garde-fous sur les saisies (doublent la validation côté serveur)
-- -----------------------------------------------------------------------------

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_values_check;
ALTER TABLE public.activities
  ADD CONSTRAINT activities_values_check CHECK (
    distance >= 0 AND distance <= 1000
    AND elevation >= 0 AND elevation <= 20000
    AND char_length(title) <= 120
    AND char_length(location) <= 120
    AND (description IS NULL OR char_length(description) <= 2000)
  );

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_check
  CHECK (char_length(content) BETWEEN 1 AND 2000);

ALTER TABLE public.user_reports
  DROP CONSTRAINT IF EXISTS user_reports_values_check;
ALTER TABLE public.user_reports
  ADD CONSTRAINT user_reports_values_check CHECK (
    char_length(reason) <= 100
    AND (description IS NULL OR char_length(description) <= 2000)
  );
