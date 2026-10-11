import { createAdminClient } from '@/lib/supabase-admin';
import { DEFAULT_AVATAR, getUsersByIds } from '@/lib/users';
import { formatRelativeDay, formatWeekday } from '@/lib/dates';
import type { ConversationPreview, Message } from '@/lib/types';

// Les identifiants sont validés en amont (isValidUserId : chiffres
// uniquement), ce qui rend sûre leur interpolation dans le filtre .or().
export async function getConversationMessages(
  userId: string,
  contactId: string,
  limit = 200
): Promise<Message[]> {
  const { data, error } = await createAdminClient()
    .from('messages')
    .select('id, created_at, sender_id, sender_name, sender_avatar, receiver_id, content')
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function getConversationPreviews(
  userId: string
): Promise<ConversationPreview[]> {
  const { data, error } = await createAdminClient()
    .from('messages')
    .select('sender_id, receiver_id, content, created_at, is_read')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  const latestByContact = new Map<
    string,
    { content: string; created_at: string; unread: boolean }
  >();
  for (const msg of data ?? []) {
    const contactId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    const unread = msg.receiver_id === userId && !msg.is_read;
    const existing = latestByContact.get(contactId);
    if (!existing) {
      latestByContact.set(contactId, {
        content: msg.content,
        created_at: msg.created_at,
        unread,
      });
    } else if (unread) {
      existing.unread = true;
    }
  }

  const profiles = await getUsersByIds(Array.from(latestByContact.keys()));
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return Array.from(latestByContact.entries()).map(([contactId, last]) => {
    const profile = profileMap.get(contactId);
    return {
      contactId,
      contactName: profile?.name ?? 'Utilisateur',
      contactAvatar: profile?.avatar_url ?? DEFAULT_AVATAR,
      lastMessage: last.content,
      time: formatRelativeDay(last.created_at, formatWeekday),
      unread: last.unread,
    };
  });
}
