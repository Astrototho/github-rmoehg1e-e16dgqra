import { getContactProfile } from '@/lib/users';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import ChatClient from '@/components/ChatClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function ChatPage({ params }: PageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/login');
  }

  const contact = await getContactProfile(params.id);

  return (
    <ChatClient
      contactId={params.id}
      contactName={contact.name}
      contactAvatar={contact.avatar}
      currentUserId={currentUser.id}
    />
  );
}
