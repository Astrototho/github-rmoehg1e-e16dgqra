'use client';

import { MOCK_USERS } from '@/lib/constants';
import { switchUserAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function UserSwitcher({
  currentUserId,
}: {
  currentUserId: string;
}) {
  const router = useRouter();

  const handleSwitch = async (userId: string) => {
    // 1. On change l'utilisateur sur le serveur
    await switchUserAction(userId);

    // 2. On rafraîchit les composants serveurs (le layout et les pages)
    router.refresh();
  };

  return (
    <select
      value={currentUserId}
      onChange={(e) => handleSwitch(e.target.value)}
      className="bg-gray-100 border-none text-xs rounded-lg px-2 py-1 text-gray-700 font-medium outline-none cursor-pointer"
    >
      {MOCK_USERS.map((user) => (
        <option key={user.id} value={user.id}>
          👤 {user.name}
        </option>
      ))}
    </select>
  );
}
