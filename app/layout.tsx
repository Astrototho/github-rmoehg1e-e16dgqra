import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import {
  Home,
  Map as MapIcon,
  PlusSquare,
  MessageCircle,
  User,
  Bell,
  Menu as MenuIcon,
} from 'lucide-react';

import { getCurrentUser } from '@/lib/session';
import UserSwitcher from '@/components/UserSwitcher';

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Perfconnect',
  description: 'Trouve ton partenaire de sport',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // On récupère l'utilisateur actif
  const currentUser = await getCurrentUser();

  return (
    <html lang="fr">
      <body className={`${inter.className} bg-gray-50 text-slate-900`}>
        {/* CONTENEUR MOBILE (Max-width pour simuler un téléphone sur PC) */}
        <div className="flex flex-col min-h-screen max-w-md mx-auto bg-white shadow-2xl relative">
          {/* --- BARRE SUPÉRIEURE (Top Nav) --- */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-black italic tracking-tighter text-primary"
            >
              PERFCONNECT
            </Link>

            <div className="flex items-center gap-3">
              {/* NOTRE NOUVEAU SÉLECTEUR */}
              <UserSwitcher />

              <button className="relative p-1 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-6 h-6 stroke-[1.5]" />
                {/* Petit point rouge de notification gardé depuis ton 2ème code */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>

              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <MenuIcon className="w-6 h-6 stroke-[1.5]" />
              </button>
            </div>
          </header>

          {/* --- CONTENU DE LA PAGE --- */}
          {/* On ajoute un padding bottom (pb-20) pour ne pas cacher le contenu sous la nav du bas */}
          <main className="flex-1 pb-20">{children}</main>

          {/* --- BARRE INFÉRIEURE (Bottom Nav) --- */}
          <footer className="fixed bottom-0 w-full max-w-md bg-white border-t px-6 h-16 flex items-center justify-between z-50">
            <Link href="/" className="flex flex-col items-center gap-1 group">
              <Home className="w-6 h-6 stroke-[1.5] group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                Fil
              </span>
            </Link>

            <Link
              href="/activities"
              className="flex flex-col items-center gap-1 group"
            >
              <MapIcon className="w-6 h-6 stroke-[1.5] group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                Sorties
              </span>
            </Link>

            {/* BOUTON CENTRAL "+" (Action principale) */}
            <Link href="/create" className="flex flex-col items-center -mt-8">
              <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/30 hover:scale-110 transition-transform active:scale-95">
                <PlusSquare className="w-7 h-7 stroke-[2]" />
              </div>
            </Link>

            <Link
              href="/messages"
              className="flex flex-col items-center gap-1 group"
            >
              <MessageCircle className="w-6 h-6 stroke-[1.5] group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                Messages
              </span>
            </Link>

            <Link
              href="/profile"
              className="flex flex-col items-center gap-1 group"
            >
              <User className="w-6 h-6 stroke-[1.5] group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                Profil
              </span>
            </Link>
          </footer>
        </div>
      </body>
    </html>
  );
}
