-- =============================================================================
-- PERFCONNECT — Migration utilisateurs réels (Strava + Supabase)
-- Exécuter dans l'éditeur SQL Supabase, section par section.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ÉTAPE 1 : Table profiles (id = Strava athlete ID, ex: "12345678")
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  name text NOT NULL,
  avatar_url text,
  email text,
  bio text,
  strava_username text,
  city text,
  country text
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ÉTAPE 2 : Nettoyer les données mock (IDs fictifs incompatibles avec Strava)
-- ⚠️  Supprime toutes les sorties/messages/participations existants.
--     Commentez cette section si vous voulez conserver les données de test.
-- -----------------------------------------------------------------------------

DELETE FROM public.participations;
DELETE FROM public.messages;
DELETE FROM public.activities;

-- -----------------------------------------------------------------------------
-- ÉTAPE 3 : Contraintes d'intégrité (profiles comme référence utilisateur)
-- -----------------------------------------------------------------------------

-- Empêcher les doublons de demande de participation
ALTER TABLE public.participations
  DROP CONSTRAINT IF EXISTS participations_user_activity_unique;

ALTER TABLE public.participations
  ADD CONSTRAINT participations_user_activity_unique
  UNIQUE (user_id, activity_id);

-- Clés étrangères vers profiles
ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_organizer_id_fkey;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_organizer_id_fkey
  FOREIGN KEY (organizer_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.participations
  DROP CONSTRAINT IF EXISTS participations_user_id_fkey;

ALTER TABLE public.participations
  ADD CONSTRAINT participations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;

ALTER TABLE public.messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- ÉTAPE 4 : Row Level Security (RLS)
-- Le serveur Next.js utilise SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- Les policies ci-dessous protègent l'accès direct via la clé anon.
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Lecture publique : fil d'actualité, profils, participations
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "activities_public_read" ON public.activities;
CREATE POLICY "activities_public_read"
  ON public.activities FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "participations_public_read" ON public.participations;
CREATE POLICY "participations_public_read"
  ON public.participations FOR SELECT
  TO anon, authenticated
  USING (true);

-- Messages : aucune policy = accès anon bloqué (lecture/écriture via service role uniquement)

-- Index utiles
CREATE INDEX IF NOT EXISTS idx_activities_organizer_id ON public.activities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date ON public.activities(start_date);
CREATE INDEX IF NOT EXISTS idx_participations_activity_id ON public.participations(activity_id);
CREATE INDEX IF NOT EXISTS idx_participations_user_id ON public.participations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
