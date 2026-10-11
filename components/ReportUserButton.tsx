'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { reportUser } from '@/app/actions';
import { DESCRIPTION_MAX, REPORT_REASONS } from '@/lib/constraints';

interface ReportUserButtonProps {
  activityId?: string;
  reportedId: string;
  reportedName: string;
}

export default function ReportUserButton({
  activityId,
  reportedId,
  reportedName,
}: ReportUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
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
        setReason(REPORT_REASONS[0]);
      }, 1500);
    } else {
      setError(result.error);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Signaler ${reportedName}`}
        title={`Signaler ${reportedName}`}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Flag className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="mt-2 w-full space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
      {sent ? (
        <p className="text-xs font-medium text-green-600">Signalement envoyé, merci.</p>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-700">Signaler {reportedName}</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-label="Motif du signalement"
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs"
          >
            {REPORT_REASONS.map((r) => (
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
            maxLength={DESCRIPTION_MAX}
            className="w-full resize-none rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
          />
          <p className="text-[10px] text-gray-400">
            Confidentiel — jamais visible par la personne signalée.
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="min-h-[40px] flex-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-h-[40px] flex-1 rounded-lg bg-red-600 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
