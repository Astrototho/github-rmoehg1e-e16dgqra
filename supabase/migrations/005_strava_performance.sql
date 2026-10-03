-- =============================================================================
-- PERFCONNECT — Tokens Strava + profils de performance (matching)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- strava_tokens : tokens OAuth Strava, accès service role uniquement
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.strava_tokens (
  user_id text PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  scope text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS strava_tokens_updated_at ON public.strava_tokens;
CREATE TRIGGER strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS : accès uniquement via la clé service role (serveur Next.js)
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- performance_profiles : indices de performance agrégés par famille de sport,
-- calculés depuis l'API Strava et mis en cache. Accès service role uniquement.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.performance_profiles (
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_family text NOT NULL CHECK (
    sport_family IN ('trail', 'course-a-pied', 'velo-route', 'velo', 'vtt')
  ),
  avg_speed_mps numeric NOT NULL,
  avg_moving_time_s numeric NOT NULL,
  avg_elevation_gain_m numeric NOT NULL,
  avg_chill_index numeric NOT NULL,
  sample_size int NOT NULL,
  computed_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, sport_family)
);

ALTER TABLE public.performance_profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_performance_profiles_user_id ON public.performance_profiles(user_id);
