'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { deleteAccountAction } from '@/app/actions';

export default function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    const result = await deleteAccountAction();
    // En cas de succès, deleteAccountAction redirige déjà (via signOut) —
    // on n'arrive ici que si quelque chose a échoué.
    if (result && !result.success) {
      setError(result.error ?? 'Une erreur est survenue.');
      setIsDeleting(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Supprimer mon compte
      </button>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          Action définitive : ton profil, tes sorties, tes messages et tes
          notifications seront supprimés. Impossible de revenir en arrière.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
          className="flex-1 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Suppression...' : 'Confirmer'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
