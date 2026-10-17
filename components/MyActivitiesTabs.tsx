'use client';

import { useState } from 'react';
import ActivityCard, { type CardBadge } from '@/components/ActivityCard';
import type { Activity } from '@/lib/types';

export interface MyActivityItem {
  activity: Activity;
  badge?: CardBadge;
}

type TabType = 'mes-sorties' | 'validees' | 'en-cours' | 'passees';

const TABS: { id: TabType; label: string }[] = [
  { id: 'mes-sorties', label: 'Mes sorties' },
  { id: 'validees', label: 'Validées' },
  { id: 'en-cours', label: 'En attente' },
  { id: 'passees', label: 'Historique' },
];

export default function MyActivitiesTabs({ tabs }: { tabs: Record<TabType, MyActivityItem[]> }) {
  const [activeTab, setActiveTab] = useState<TabType>('mes-sorties');
  const items = tabs[activeTab];

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="border-b bg-white px-4 py-6">
        <h1 className="text-2xl font-black text-navy-900">Mes Sorties</h1>
        <p className="mt-1 text-sm text-gray-500">Gère ton planning sportif</p>
      </div>

      <div className="sticky top-header z-40 border-b bg-white">
        <div role="tablist" className="hide-scrollbar flex overflow-x-auto px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tabs[tab.id].length > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">{tabs[tab.id].length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" className="flex-1 space-y-4 p-4">
        {items.length > 0 ? (
          items.map(({ activity, badge }) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              badge={badge}
              href={`/activities/${activity.id}`}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <div className="mb-3 text-4xl">📭</div>
            <h3 className="mb-1 text-lg font-bold text-navy-900">Aucune sortie ici</h3>
            <p className="text-sm text-gray-500">
              Il n&apos;y a rien à afficher dans cette catégorie pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
