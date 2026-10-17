'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, Plus, MessageCircle, User } from 'lucide-react';

interface BottomNavProps {
  unreadMessages: number;
}

const ITEMS = [
  { href: '/', label: 'Fil', icon: Home, match: (p: string) => p === '/' },
  {
    href: '/activities',
    label: 'Sorties',
    icon: MapIcon,
    match: (p: string) => p.startsWith('/activities'),
  },
  {
    href: '/messages',
    label: 'Messages',
    icon: MessageCircle,
    match: (p: string) => p.startsWith('/messages'),
  },
  {
    href: '/profile',
    label: 'Profil',
    icon: User,
    match: (p: string) => p.startsWith('/profile'),
  },
];

export default function BottomNav({ unreadMessages }: BottomNavProps) {
  const pathname = usePathname() ?? '/';
  const [fil, sorties, messages, profil] = ITEMS;

  const renderItem = (item: (typeof ITEMS)[number], badge?: number) => {
    const active = item.match(pathname);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={`relative flex min-h-[44px] flex-col items-center justify-center gap-1 transition-colors ${
          active ? 'text-primary' : 'text-slate-700 hover:text-primary'
        }`}
      >
        <Icon className="h-6 w-6 stroke-[1.5]" />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 left-1/2 ml-1 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-tighter">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md border-t bg-white pb-safe"
    >
      <div className="grid h-16 grid-cols-5 items-center px-2">
        {renderItem(fil)}
        {renderItem(sorties)}

        {/* Bouton central "+" (action principale) */}
        <Link
          href="/create"
          aria-label="Proposer une sortie"
          className="-mt-8 flex flex-col items-center"
        >
          <span className="rounded-2xl bg-primary p-3 text-white shadow-lg shadow-primary/30 transition-transform hover:scale-110 active:scale-95">
            <Plus className="h-7 w-7 stroke-[2.5]" />
          </span>
        </Link>

        {renderItem(messages, unreadMessages)}
        {renderItem(profil)}
      </div>
    </nav>
  );
}
