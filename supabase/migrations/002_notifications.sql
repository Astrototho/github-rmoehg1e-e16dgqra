-- =============================================================================
-- PERFCONNECT — Notifications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now() NOT NULL,
  user_id text NOT NULL,
  type text NOT NULL CHECK (
    type IN (
      'message',
      'participation_request',
      'participation_approved',
      'participation_rejected'
    )
  ),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  is_read boolean DEFAULT false NOT NULL
);

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- RLS : accès uniquement via la clé service role (serveur Next.js)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
