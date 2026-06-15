import { createAdminClient } from '@/lib/supabase-admin';

export async function markConversationAsRead(
  currentUserId: string,
  contactId: string
) {
  const { error } = await createAdminClient()
    .from('messages')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', contactId)
    .eq('is_read', false);

  if (error) {
    console.error('Erreur markConversationAsRead:', error);
  }
}

export async function getUnreadConversationsCount(
  userId: string
): Promise<number> {
  const { data, error } = await createAdminClient()
    .from('messages')
    .select('sender_id')
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Erreur getUnreadConversationsCount:', error);
    return 0;
  }

  return new Set((data ?? []).map((m) => m.sender_id)).size;
}
