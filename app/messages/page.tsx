import { redirect } from 'next/navigation';
import MessagesList from '@/components/MessagesList';
import { getCurrentUser } from '@/lib/session';
import { getConversationPreviews } from '@/lib/conversations';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  let conversations: Awaited<ReturnType<typeof getConversationPreviews>> = [];
  let loadError = false;
  try {
    conversations = await getConversationPreviews(currentUser.id);
  } catch (err) {
    console.error('Erreur getConversationPreviews:', err);
    loadError = true;
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="sticky top-header z-40 flex items-center justify-between border-b border-gray-100 bg-white/90 px-4 py-6 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">Tes discussions en cours</p>
        </div>
      </div>

      {loadError && (
        <p className="p-4 text-center text-sm text-red-500">
          Impossible de charger les messages.
        </p>
      )}

      <MessagesList conversations={conversations} />
    </div>
  );
}
