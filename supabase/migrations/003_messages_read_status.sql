-- =============================================================================
-- PERFCONNECT — Statut de lecture des messages
-- =============================================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages(receiver_id, is_read);
