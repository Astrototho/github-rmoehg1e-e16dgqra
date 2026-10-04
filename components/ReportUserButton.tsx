'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { reportUser } from '@/app/actions';

interface ReportUserButtonProps {
  activityId?: string;
  reportedId: string;
  reportedName: string;
}

const REASONS = [
  'Comportement déplacé',
  'Message inapproprié',
  "Ne s'est pas présenté",
  'Autre',
];

export default function ReportUserButton({
  activityId,
  reportedId,
  reportedName,
}: ReportUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await reportUser({
      activityId,
      reportedId,
      reason,
      description,
    });
    setIsSubmitting(false);

    if (result.success) {
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setDescription('');
        setReason(REASONS[0]);
      }, 1500);
    } else {
      alert(result.error);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Signaler ${reportedName}`}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
      >
        <Flag className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="w-full mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
      {sent ? (
        <p className="text-xs text-green-600 font-medium">
          Signalement envoyé, merci.
        </p>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-700">
            Signaler {reportedName}
          </p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails (optionnel)"
            rows={2}
            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none"
          />
          <p className="text-[10px] text-gray-400">
            Confidentiel — jamais visible par la personne signalée.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1 text-xs py-1.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 text-xs py-1.5 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
