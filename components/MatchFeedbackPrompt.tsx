'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitMatchFeedback } from '@/app/actions';

interface MatchFeedbackPromptProps {
  activityId: string;
  ratedName: string;
  // null = pas encore répondu, true/false = réponse déjà donnée précédemment.
  initialAnswer: boolean | null;
}

export default function MatchFeedbackPrompt({
  activityId,
  ratedName,
  initialAnswer,
}: MatchFeedbackPromptProps) {
  const [answered, setAnswered] = useState(initialAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = async (accurate: boolean) => {
    setIsSubmitting(true);
    setError(null);
    const result = await submitMatchFeedback(activityId, accurate);
    setIsSubmitting(false);
    if (result.success) {
      setAnswered(accurate);
    } else {
      setError(result.error);
    }
  };

  if (answered !== null) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          Merci pour ton retour sur le matching avec {ratedName} !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-900">
        Le % de matching affiché avec {ratedName} correspondait-il à la réalité ?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAnswer(true)}
          disabled={isSubmitting}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-green-50 text-sm font-semibold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
        >
          <ThumbsUp className="h-4 w-4" />
          Oui
        </button>
        <button
          type="button"
          onClick={() => handleAnswer(false)}
          disabled={isSubmitting}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          <ThumbsDown className="h-4 w-4" />
          Pas vraiment
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
