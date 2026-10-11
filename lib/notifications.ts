import { createAdminClient } from '@/lib/supabase-admin';
import { runInBackground } from '@/lib/background';
import { sendPushToUsers } from '@/lib/push';
import type { Notification, NotificationType } from '@/lib/types';

interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  relatedId?: string;
}

export async function createNotifications(notifications: NewNotification[]) {
  if (notifications.length === 0) return;

  const { error } = await createAdminClient()
    .from('notifications')
    .insert(
      notifications.map((n) => ({
        user_id: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link ?? null,
        related_id: n.relatedId ?? null,
      }))
    );

  if (error) {
    console.error('Erreur createNotifications:', error);
    return;
  }

  // Même contenu en notification push sur les téléphones abonnés, envoyé
  // après la réponse pour ne pas ralentir l'action de l'utilisateur.
  runInBackground('notifications push', () =>
    Promise.all(
      notifications.map((n) =>
        sendPushToUsers([n.userId], {
          title: n.title,
          body: n.body,
          url: n.link ?? '/notifications',
          tag: n.relatedId ? `${n.type}-${n.relatedId}` : undefined,
        })
      )
    )
  );
}

export async function createNotification(notification: NewNotification) {
  await createNotifications([notification]);
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

// Notifications purement informatives (réponse à une demande, sortie modifiée
// ou annulée) : elles disparaissent dès que la page Notifications est ouverte.
export async function markResponseNotificationsAsRead(userId: string) {
  const { error } = await createAdminClient()
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .in('type', [
      'participation_approved',
      'participation_rejected',
      'activity_updated',
      'activity_cancelled',
    ]);

  if (error) {
    console.error('Erreur markResponseNotificationsAsRead:', error);
  }
}

// Notification "demande d'acceptation de sortie" liée à une participation.
// Elle disparaît dès que l'organisateur accepte ou refuse la demande.
export async function markNotificationsByRelatedId(relatedId: string | string[]) {
  const ids = Array.isArray(relatedId) ? relatedId : [relatedId];
  if (ids.length === 0) return;

  const { error } = await createAdminClient()
    .from('notifications')
    .update({ is_read: true })
    .in('related_id', ids)
    .eq('is_read', false);

  if (error) {
    console.error('Erreur markNotificationsByRelatedId:', error);
  }
}
