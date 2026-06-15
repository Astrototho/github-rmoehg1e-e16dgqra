-- =============================================================================
-- PERFCONNECT — Lien entre une notification et l'objet concerné
-- =============================================================================

-- related_id permet de retrouver la notification liée à une participation
-- (ex. notification "participation_request" envoyée à l'organisateur) afin de
-- la marquer comme lue dès que la demande est acceptée ou refusée.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_id text;

CREATE INDEX IF NOT EXISTS idx_notifications_related_id
  ON public.notifications(related_id);
