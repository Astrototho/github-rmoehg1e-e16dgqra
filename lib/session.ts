import { MOCK_USERS } from './constants';
import { cookies } from 'next/headers';

export async function getCurrentUser() {
  try {
    // 1. Essaye de lire depuis les cookies (défini par le client)
    const cookieStore = await cookies();
    const userId = cookieStore.get('currentUserId')?.value;
    
    if (userId && MOCK_USERS.find(u => u.id === userId)) {
      return MOCK_USERS.find(u => u.id === userId)!;
    }
  } catch (e) {
    // Cookies not available (edge case)
  }
  
  // 2. Fallback à l'utilisateur par défaut
  return MOCK_USERS[0];
}

export function setGlobalUser(userId: string) {
  // Deprecated - kept for backward compatibility
  // Use client-side localStorage + cookies instead
}