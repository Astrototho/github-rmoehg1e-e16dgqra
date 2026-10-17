import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';
import PropositionForm from '@/components/PropositionForm';
import { getCurrentUser } from '@/lib/session';
import { getActivityByIdFromDb } from '@/lib/activities';
import { getSavedPlaces } from '@/lib/saved-places';
import { getFallbackCenter } from '@/lib/places';
import { canEditActivity } from '@/lib/activity-rules';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditActivityPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const activity = await getActivityByIdFromDb(id);
  if (!activity || activity.organizer_id !== currentUser.id) notFound();

  const editable = canEditActivity(activity);
  const savedPlaces = editable ? await getSavedPlaces(currentUser.id) : [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/activities/${activity.id}`}
          aria-label="Retour à la sortie"
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-black">Modifier la sortie</h1>
      </div>

      {editable ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <PropositionForm
            activity={activity}
            savedPlaces={savedPlaces}
            fallbackCenter={getFallbackCenter(currentUser)}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 px-6 py-12 text-center">
          <Lock className="mb-3 h-8 w-8 text-gray-400" />
          <p className="font-semibold text-navy-900">Modification impossible</p>
          <p className="mt-1 text-sm text-gray-500">
            {activity.status === 'cancelled'
              ? 'Cette sortie a été annulée.'
              : "Une sortie ne peut plus être modifiée moins d'1 h avant le départ."}
          </p>
        </div>
      )}
    </div>
  );
}
