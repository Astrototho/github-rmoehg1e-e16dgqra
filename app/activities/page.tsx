'use client';

import { useState, useEffect } from 'react';
import ActivityCard, { Activity } from '@/components/ActivityCard';
import { getMyActivities } from '@/app/actions';

type TabType = 'en-cours' | 'validees' | 'mes-sorties' | 'passees';

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('mes-sorties');
  
  // Nouveaux états pour stocker les vraies données et gérer le chargement
  const [activitiesData, setActivitiesData] = useState<Record<TabType, Activity[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect se lance tout seul au chargement de la page
  useEffect(() => {
    async function loadActivities() {
      setIsLoading(true);
      const result = await getMyActivities();
      
      if (result.success && result.data) {
        // On force le typage ici pour que TypeScript soit content
        setActivitiesData(result.data as unknown as Record<TabType, Activity[]>);
      } else {
        alert(result.error || "Erreur de chargement");
      }
      setIsLoading(false);
    }

    loadActivities();
  }, []); // Le tableau vide [] signifie "ne le faire qu'une seule fois au début"

  // Si on charge, on affiche un message d'attente
  if (isLoading || !activitiesData) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center pt-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Chargement de tes sorties...</p>
      </div>
    );
  }

  // On récupère la bonne liste en fonction de l'onglet cliqué
  const currentActivities = activitiesData[activeTab];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* En-tête */}
      <div className="px-4 py-6 bg-white border-b">
        <h1 className="text-2xl font-black text-gray-900">Mes Sorties</h1>
        <p className="text-gray-500 text-sm mt-1">Gère ton planning sportif</p>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white border-b sticky top-14 z-40">
        <div className="flex overflow-x-auto hide-scrollbar px-2">
          <button
            onClick={() => setActiveTab('mes-sorties')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'mes-sorties'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mes sorties
          </button>
          <button
            onClick={() => setActiveTab('validees')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'validees'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Validées
          </button>
          <button
            onClick={() => setActiveTab('en-cours')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'en-cours'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setActiveTab('passees')}
            className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'passees'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {/* Liste des cartes */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {currentActivities && currentActivities.length > 0 ? (
          currentActivities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Aucune sortie ici</h3>
            <p className="text-gray-500 text-sm">
              Il n'y a rien à afficher dans cette catégorie pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}