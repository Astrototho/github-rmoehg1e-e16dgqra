import { MOCK_USERS } from './constants';

// On utilise l'objet 'global' pour que la variable survive même si le fichier est rechargé
const globalAny: any = global;

if (!globalAny.mockSession) {
  globalAny.mockSession = {
    userId: 'user_strava_mock_123'
  };
}

export async function getCurrentUser() {
  // On lit directement dans la mémoire globale du serveur
  const currentId = globalAny.mockSession.userId;
  return MOCK_USERS.find(u => u.id === currentId) || MOCK_USERS[0];
}

export function setGlobalUser(userId: string) {
  // On écrit dans la mémoire globale du serveur
  globalAny.mockSession.userId = userId;
}