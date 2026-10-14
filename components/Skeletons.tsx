// Squelettes affichés instantanément pendant le rendu serveur d'une page
// (app/**/loading.tsx) : le tap donne un retour visuel immédiat.

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
      <div className="h-32 animate-pulse bg-gray-200" />
      <div className="space-y-3 p-4">
        <Bar className="h-3 w-24" />
        <Bar className="h-5 w-3/4" />
        <Bar className="h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Bar className="h-10" />
          <Bar className="h-10" />
          <Bar className="h-10" />
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Chargement">
      <Bar className="h-7 w-48" />
      <div className="flex gap-2">
        <Bar className="h-9 w-20 rounded-full" />
        <Bar className="h-9 w-24 rounded-full" />
        <Bar className="h-9 w-20 rounded-full" />
      </div>
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-busy="true" aria-label="Chargement">
      <Bar className="h-7 w-40" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3">
          <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <Bar className="h-4 w-1/2" />
            <Bar className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement">
      <div className="h-56 animate-pulse bg-gray-200" />
      <div className="space-y-3 p-4">
        <Bar className="h-6 w-3/4" />
        <Bar className="h-4 w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          <Bar className="h-14" />
          <Bar className="h-14" />
          <Bar className="h-14" />
        </div>
        <Bar className="h-24" />
      </div>
    </div>
  );
}
