// Logo officiel « Powered by Strava » exigé par les règles de l'API Strava,
// plus discret que le logo PerfConnect.
export default function PoweredByStrava({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/strava/api_logo_pwrdBy_strava_horiz_orange.svg"
        alt="Powered by Strava"
        width={365}
        height={37}
        className="h-4 w-auto"
      />
    </div>
  );
}
