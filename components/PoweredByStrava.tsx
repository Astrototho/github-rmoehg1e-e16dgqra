// Mention « Powered by Strava » exigée par les règles de l'API Strava
// (plus discrète que le logo PerfConnect).
export default function PoweredByStrava({ className = '' }: { className?: string }) {
  return (
    <p className={`flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 ${className}`}>
      Powered by
      <span className="flex items-center gap-1 text-[#FC5200]">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.912-11.724h-3.066m-11.4-11.2L11.566 13.22h3.065L7.665 0 1.753 11.724h3.066" />
        </svg>
        Strava
      </span>
    </p>
  );
}
