-- =============================================================================
-- PERFCONNECT — Annulation/modification des sorties, lieux de départ
-- enregistrés, journalisation du % de match affiché
-- =============================================================================

-- -----------------------------------------------------------------------------
-- activities : statut (annulation "douce", conservée pour les statistiques et
-- l'entraînement futur du matching) + date de dernière modification
-- -----------------------------------------------------------------------------

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_status_check;
ALTER TABLE public.activities
  ADD CONSTRAINT activities_status_check
  CHECK (status IN ('active', 'cancelled'));

DROP TRIGGER IF EXISTS activities_updated_at ON public.activities;
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_activities_status_start_date
  ON public.activities(status, start_date);

-- -----------------------------------------------------------------------------
-- notifications : nouveaux types (sortie modifiée / annulée)
-- -----------------------------------------------------------------------------

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN (
      'message',
      'participation_request',
      'participation_approved',
      'participation_rejected',
      'activity_updated',
      'activity_cancelled'
    )
  );

-- -----------------------------------------------------------------------------
-- saved_places : lieux de départ enregistrés par chaque organisateur.
-- Privés (service role uniquement). name_normalized = nom sans casse, accents,
-- ponctuation ni espaces superflus : sert à retrouver le point GPS quand
-- l'utilisateur retape le même lieu.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.saved_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  name_normalized text NOT NULL CHECK (char_length(name_normalized) >= 1),
  latitude numeric NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name_normalized)
);

ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;
-- RLS : aucune policy, accessible uniquement via la clé service role.

DROP TRIGGER IF EXISTS saved_places_updated_at ON public.saved_places;
CREATE TRIGGER saved_places_updated_at
  BEFORE UPDATE ON public.saved_places
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- participations : % de match affiché au moment de la demande (données
-- d'entraînement du futur modèle de matching) + version de la formule.
-- -----------------------------------------------------------------------------

ALTER TABLE public.participations
  ADD COLUMN IF NOT EXISTS match_percentage smallint
    CHECK (match_percentage IS NULL OR match_percentage BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS matching_version text;
