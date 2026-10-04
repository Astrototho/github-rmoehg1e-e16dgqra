'use client';

import { useState } from 'react';
import { Share } from 'lucide-react';

export default function ShareInviteButton() {
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleShare = async () => {
    const url = window.location.origin;
    const shareData = {
      title: 'PerfConnect',
      text: 'Rejoins-moi sur PerfConnect pour trouver des partenaires de sport !',
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // L'utilisateur a annulé le partage, rien à faire.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch {
      // Presse-papiers indisponible, rien d'autre à proposer.
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        title="Inviter des amis sur PerfConnect"
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Share className="w-5 h-5 text-gray-600" />
      </button>

      {showCopiedToast && (
        <div className="absolute top-full right-0 mt-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50">
          Lien copié !
        </div>
      )}
    </div>
  );
}
