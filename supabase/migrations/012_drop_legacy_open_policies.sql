-- =============================================================================
-- PERFCONNECT — Suppression des anciennes policies RLS "ouvertes à tous"
-- =============================================================================
-- Ces policies, créées à la main avant la migration 001 (époque des données
-- de démonstration), permettaient à quiconque possède la clé anon publique de
-- LIRE TOUS LES MESSAGES privés et de créer / modifier / supprimer sorties et
-- participations directement via l'API REST de Supabase.
--
-- L'application passe exclusivement par le serveur Next.js (clé service role,
-- qui ignore le RLS) : seules les lectures publiques documentées restent
-- (profiles_public_read, activities_public_read, participations_public_read).

DROP POLICY IF EXISTS "Autoriser l'insertion à tout le monde" ON public.activities;
DROP POLICY IF EXISTS "Autoriser la lecture à tout le monde" ON public.activities;
DROP POLICY IF EXISTS "Autoriser la modification à tout le monde" ON public.activities;
DROP POLICY IF EXISTS "Autoriser la suppression à tout le monde" ON public.activities;

DROP POLICY IF EXISTS "Autoriser l'insertion à tout le monde" ON public.messages;
DROP POLICY IF EXISTS "Autoriser la lecture à tout le monde" ON public.messages;
DROP POLICY IF EXISTS "Autoriser la modification à tout le monde" ON public.messages;

DROP POLICY IF EXISTS "Autoriser l'insertion à tout le monde" ON public.participations;
DROP POLICY IF EXISTS "Autoriser la lecture à tout le monde" ON public.participations;
DROP POLICY IF EXISTS "Autoriser la modification à tout le monde" ON public.participations;
DROP POLICY IF EXISTS "Autoriser la suppression à tout le monde" ON public.participations;

-- Index manquants signalés par l'advisor de performance (clés étrangères).
CREATE INDEX IF NOT EXISTS idx_match_feedback_rater_id ON public.match_feedback(rater_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_activity_id ON public.user_reports(activity_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_reporter_id ON public.user_reports(reporter_id);
