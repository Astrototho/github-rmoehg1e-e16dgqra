'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu as MenuIcon, LogOut, LogIn, Globe } from 'lucide-react';
import { signOutAction } from '@/app/actions';

interface HeaderMenuProps {
  isLoggedIn: boolean;
}

export default function HeaderMenu({ isLoggedIn }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="rounded-full p-2 transition-colors hover:bg-gray-100"
      >
        <MenuIcon className="h-6 w-6 stroke-[1.5]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
            <a
              href="https://perfconnect.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 transition-colors hover:bg-gray-50"
            >
              <Globe className="h-4 w-4" />
              perfconnect.fr
            </a>
            {isLoggedIn ? (
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-gray-50"
              >
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
