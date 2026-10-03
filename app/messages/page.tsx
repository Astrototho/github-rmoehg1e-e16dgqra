import { getConversations } from '@/app/actions';
import MessagesList from '@/components/MessagesList';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  const result = await getConversations();
  const conversations = result.success ? result.data ?? [] : [];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 py-6 border-b border-gray-100 flex items-center justify-between sticky top-14 bg-white/90 backdrop-blur-md z-40">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          <p className="text-gray-500 text-sm mt-1">Tes discussions en cours</p>
        </div>
      </div>

      {!result.success && (
        <p className="text-red-500 text-sm p-4 text-center">{result.error}</p>
      )}

      <MessagesList conversations={conversations} />
    </div>
  );
}
