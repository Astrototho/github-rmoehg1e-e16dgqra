import { notFound, redirect } from 'next/navigation';
import { getContactProfile } from '@/lib/users';
import { getCurrentUser } from '@/lib/session';
import { isValidUserId } from '@/lib/validation';
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

  const contact = await getContactProfile(id);
  if (!contact) notFound();

  return (
    <ChatClient
      contactId={id}
      contactName={contact.name}
      contactAvatar={contact.avatar}
      currentUserId={currentUser.id}
    />
  );
}
