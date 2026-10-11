-- =============================================================================
-- PERFCONNECT — Abonnements aux notifications push (PWA)
-- =============================================================================
-- Un abonnement = un navigateur / téléphone d'un utilisateur. vapid_public_key
-- mémorise la clé VAPID utilisée à l'inscription : le développement local et la
-- production partagent cette base mais pas les mêmes clés, et un service de
-- push refuse un envoi signé avec une autre clé que celle de l'abonnement.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE CHECK (char_length(endpoint) <= 1000),
  p256dh text NOT NULL CHECK (char_length(p256dh) <= 200),
  auth text NOT NULL CHECK (char_length(auth) <= 100),
  vapid_public_key text NOT NULL,
  user_agent text CHECK (user_agent IS NULL OR char_length(user_agent) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- RLS : aucune policy, accessible uniquement via la clé service role.

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);
