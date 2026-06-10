import { auth, signOut } from '@/auth';
import Link from 'next/link';

export default async function AuthButton() {
  const session = await auth();

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name ?? 'Profil'}
            className="w-7 h-7 rounded-full border border-gray-200 object-cover"
          />
        )}
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="text-xs font-medium text-gray-600 hover:text-gray-900"
          >
            Déconnexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
    >
      Connexion
    </Link>
  );
}
