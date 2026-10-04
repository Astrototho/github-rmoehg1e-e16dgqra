-- =============================================================================
-- PERFCONNECT — Retours sur la justesse du matching + signalements
-- =============================================================================

-- -----------------------------------------------------------------------------
-- match_feedback : apres une sortie, un participant indique si le % de
-- matching affiche correspondait a la realite. Sert a ajuster la formule.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  rater_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accurate boolean NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (activity_id, rater_id)
);

ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;
-- RLS : aucune policy, accessible uniquement via la cle service role.

CREATE INDEX IF NOT EXISTS idx_match_feedback_rated_id ON public.match_feedback(rated_id);

-- -----------------------------------------------------------------------------
-- user_reports : signalement confidentiel d'un comportement suspect/deplace.
-- Jamais expose a la personne signalee ni aux autres utilisateurs — reserve
-- a une consultation manuelle cote admin tant qu'il n'y a pas de moderation.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  reporter_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
-- RLS : aucune policy, strictement confidentiel, cle service role uniquement.

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_id ON public.user_reports(reported_id);
