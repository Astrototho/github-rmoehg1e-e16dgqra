import { createAdminClient } from '@/lib/supabase-admin';
import type { Notification, NotificationType } from '@/lib/types';

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedId?: string;
}) {
  const { error } = await createAdminClient().from('notifications').insert([
    {
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link ?? null,
      related_id: params.relatedId ?? null,
    },
  ]);

  if (error) {
    console.error('Erreur createNotification:', error);
  }
}

export async function getNotificationsForUser(
  userId: string
): Promise<Notification[]> {
  const { data, error } = await createAdminClient()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Erreur getNotificationsForUser:', error);
    return [];
  }

  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const { count, error } = await createAdminClient()
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Erreur getUnreadNotificationCount:', error);
    return 0;
  }

  return count ?? 0;
}

// Réponses à une demande de participation (acceptée / refusée).
// Ces notifications disparaissent dès que la page Notifications est ouverte.
export async function markResponseNotificationsAsRead(userId: string) {
  const { error } = await createAdminClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .in('type', ['participation_approved', 'participation_rejected']);

  if (error) {
    console.error('Erreur markResponseNotificationsAsRead:', error);
  }
}

// Notification "demande d'acceptation de sortie" liée à une participation.
// Elle disparaît dès que l'organisateur accepte ou refuse la demande.
export async function markNotificationsByRelatedId(relatedId: string) {
  const { error } = await createAdminClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('related_id', relatedId)
    .eq('is_read', false);

  if (error) {
    console.error('Erreur markNotificationsByRelatedId:', error);
  }
}
