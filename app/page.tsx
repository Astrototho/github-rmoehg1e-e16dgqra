import ActivityCard from '@/components/ActivityCard';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. On récupère les sorties
  const { data: activities, error } = await supabase
    .from('activities')
    .select('*')
    .order('start_date', { ascending: true });

  return (
    <div className="space-y-6 p-4">
      {/* Petit titre de section pour le Fil */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full"></span>
          Sorties à proximité
        </h2>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {activities?.length || 0} TRAITS
        </span>
      </div>

      <div className="space-y-4">
        {error && (
          <p className="text-red-500 text-sm p-4 bg-red-50 rounded-xl">
            Erreur Supabase: {error.message}
          </p>
        )}

        {activities?.map((act) => {
          const activityForCard = {
            ...act,
            date: act.start_date,
            time: new Date(act.start_date).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            user: {
              name: 'Athlète',
              avatar:
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100',
            },
            participants: [],
          };

          return <ActivityCard key={act.id} activity={activityForCard} />;
        })}

        {(!activities || activities.length === 0) && (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl border-gray-100">
            <p className="text-gray-400 text-sm">Aucune sortie de prévue...</p>
          </div>
        )}
      </div>
    </div>
  );
}
