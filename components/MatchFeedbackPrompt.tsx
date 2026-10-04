'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitMatchFeedback } from '@/app/actions';

interface MatchFeedbackPromptProps {
  activityId: string;
  ratedId: string;
  ratedName: string;
  // null = pas encore répondu, true/false = réponse déjà donnée précédemment.
  initialAnswer: boolean | null;
}

export default function MatchFeedbackPrompt({
  activityId,
  ratedId,
  ratedName,
  initialAnswer,
}: MatchFeedbackPromptProps) {
  const [answered, setAnswered] = useState(initialAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = async (accurate: boolean) => {
    setIsSubmitting(true);
    const result = await submitMatchFeedback(activityId, ratedId, accurate);
    setIsSubmitting(false);
    if (result.success) {
      setAnswered(accurate);
    }
  };

  if (answered !== null) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500">
          Merci pour ton retour sur le matching avec {ratedName} !
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
      <p className="text-sm font-medium text-gray-900">
        Le % de matching affiché avec {ratedName} correspondait-il à la
        réalité ?
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleAnswer(true)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <ThumbsUp className="w-4 h-4" />
          Oui
        </button>
        <button
          type="button"
          onClick={() => handleAnswer(false)}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <ThumbsDown className="w-4 h-4" />
          Pas vraiment
        </button>
      </div>
    </div>
  );
}
