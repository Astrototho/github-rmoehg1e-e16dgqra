'use client';

import { useState } from 'react';
import { Share, Check } from 'lucide-react';

export default function ShareInviteButton() {
  const [copied, setCopied] = useState(false);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Presse-papiers indisponible, rien d'autre à proposer.
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Inviter des amis sur PerfConnect"
      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
    >
      {copied ? (
        <Check className="w-5 h-5 text-green-600" />
      ) : (
        <Share className="w-5 h-5 text-gray-600" />
      )}
    </button>
  );
}
