import { createAdminClient } from '@/lib/supabase-admin';

// Limites anti-abus simples, comptées directement en base (pas d'infra en
// plus) : nombre maximal de lignes créées par un utilisateur sur une période.
export const RATE_LIMITS = {
  messages: { table: 'messages', column: 'sender_id', max: 30, windowMs: 60_000 },
  activities: {
    table: 'activities',
    column: 'organizer_id',
    max: 20,
    windowMs: 24 * 60 * 60 * 1000,
  },
  reports: {
    table: 'user_reports',
    column: 'reporter_id',
    max: 10,
    windowMs: 24 * 60 * 60 * 1000,
  },
} as const;

export async function isRateLimited(
  kind: keyof typeof RATE_LIMITS,
  userId: string
): Promise<boolean> {
  const limit = RATE_LIMITS[kind];
  const since = new Date(Date.now() - limit.windowMs).toISOString();

  const { count, error } = await createAdminClient()
    .from(limit.table)
    .select('id', { count: 'exact', head: true })
    .eq(limit.column, userId)
    .gte('created_at', since);

  if (error) {
    console.error(`Erreur isRateLimited(${kind}):`, error);
    return false;
  }
  return (count ?? 0) >= limit.max;
}
