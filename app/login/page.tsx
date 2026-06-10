import { signIn } from '@/auth';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">🏃</span>
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">
        Bienvenue sur PerfConnect
      </h1>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        Connecte-toi avec ton compte Strava pour proposer des sorties,
        participer et échanger avec la communauté.
      </p>

      <form
        action={async () => {
          'use server';
          await signIn('strava', { redirectTo: '/' });
        }}
      >
        <button
          type="submit"
          className="w-full max-w-xs bg-[#FC4C02] hover:bg-[#e34402] text-white font-bold py-4 px-8 rounded-2xl transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.912-11.724h-3.066m-11.4-11.2L11.566 13.22h3.065L7.665 0 1.753 11.724h3.066" />
          </svg>
          Se connecter avec Strava
        </button>
      </form>

      <Link
        href="/"
        className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
      >
        Continuer sans connexion
      </Link>
    </div>
  );
}
