import { after } from 'next/server';

/**
 * Lance une tâche après l'envoi de la réponse (sur Vercel, la fonction reste
 * active jusqu'à la fin de la tâche). Hors contexte de requête, la tâche est
 * simplement lancée sans être attendue.
 */
export function runInBackground(label: string, task: () => Promise<unknown>) {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error(`Erreur tâche de fond (${label}):`, err);
    }
  };

  try {
    after(run);
  } catch {
    void run();
  }
}
