import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase-admin';

// Notifications push (PWA) via le protocole Web Push standard, signées avec
// une paire de clés VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).
// Gratuit, sans Firebase. Sans clés configurées, l'envoi est simplement ignoré.

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  // Une notification avec le même tag remplace la précédente (ex. messages
  // d'une même conversation).
  tag?: string;
}

// Seuls les services de push des navigateurs sont acceptés comme destination :
// le serveur ne doit jamais envoyer de requête vers une URL arbitraire
// fournie par un client.
const ALLOWED_PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /^updates\.push\.services\.mozilla\.com$/,
  /^web\.push\.apple\.com$/,
  /^[a-z0-9-]+\.notify\.windows\.com$/,
];

export function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return (
      url.protocol === 'https:' && ALLOWED_PUSH_HOSTS.some((re) => re.test(url.hostname))
    );
  } catch {
    return false;
  }
}

function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

let configured: boolean | null = null;
function configureWebPush(): boolean {
  if (configured !== null) return configured;
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'https://app.perfconnect.fr',
    publicKey,
    privateKey
  );
  configured = true;
  return true;
}

export async function savePushSubscriptionForUser(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string },
  userAgent: string | null
): Promise<boolean> {
  const publicKey = getVapidPublicKey();
  if (!publicKey) return false;

  // Un même téléphone qui change de compte réutilise le même endpoint : il est
  // alors rattaché au nouvel utilisateur.
  const { error } = await createAdminClient()
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
        vapid_public_key: publicKey,
        user_agent: userAgent,
      },
      { onConflict: 'endpoint' }
    );

  if (error) {
    console.error('Erreur savePushSubscriptionForUser:', error);
    return false;
  }
  return true;
}

export async function deletePushSubscriptionForUser(userId: string, endpoint: string) {
  const { error } = await createAdminClient()
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
  if (error) console.error('Erreur deletePushSubscriptionForUser:', error);
}

/** Envoie une notification push à tous les appareils abonnés des utilisateurs. */
export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0 || !configureWebPush()) return;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', Array.from(new Set(userIds)))
    // Abonnements créés avec une autre paire de clés (ex. en local) : un envoi
    // signé avec nos clés serait refusé par le service de push.
    .eq('vapid_public_key', getVapidPublicKey()!);

  if (error) {
    console.error('Erreur sendPushToUsers (lecture):', error);
    return;
  }

  const body = JSON.stringify(payload);
  await Promise.all(
    (data ?? []).map(async (sub) => {
      if (!isAllowedPushEndpoint(sub.endpoint)) return;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 24 * 60 * 60, urgency: 'normal' }
        );
        await admin
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // Abonnement expiré ou révoqué (app désinstallée, permission retirée).
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error('Erreur envoi push:', statusCode ?? err);
        }
      }
    })
  );
}
