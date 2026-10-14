import { notFound, redirect } from 'next/navigation';
import { getContactProfile } from '@/lib/users';
import { getCurrentUser } from '@/lib/session';
import { isValidUserId } from '@/lib/validation';
import { getConversationMessages } from '@/lib/conversations';
import { markConversationAsRead } from '@/lib/messages';
import ChatClient from '@/components/ChatClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');
  if (!isValidUserId(id) || id === currentUser.id) notFound();

  // Profil, messages et marquage comme lus en parallèle : la conversation
  // s'affiche dès le premier rendu, sans attendre l'hydratation.
  const [contact, messages, markedAsRead] = await Promise.all([
    getContactProfile(id),
    getConversationMessages(currentUser.id, id),
    markConversationAsRead(currentUser.id, id),
  ]);
  if (!contact) notFound();

  return (
    <ChatClient
      contactId={id}
      contactName={contact.name}
      contactAvatar={contact.avatar}
      currentUserId={currentUser.id}
      initialMessages={messages}
      hadUnread={markedAsRead > 0}
    />
  );
}
