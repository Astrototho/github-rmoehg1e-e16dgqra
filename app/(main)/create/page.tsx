import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import PropositionForm from '@/components/PropositionForm';
import { getCurrentUser } from '@/lib/session';
import { getSavedPlaces } from '@/lib/saved-places';
import { getFallbackCenter } from '@/lib/places';

export const dynamic = 'force-dynamic';

export default async function CreateActivityPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const savedPlaces = await getSavedPlaces(currentUser.id);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Retour"
          className="rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-black">Proposer une sortie</h1>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <PropositionForm
          savedPlaces={savedPlaces}
          fallbackCenter={getFallbackCenter(currentUser)}
        />
      </div>

      <p className="px-8 text-center text-xs text-gray-400">
        Ta sortie sera visible immédiatement par tous les membres de la communauté.
      </p>
    </div>
  );
}
