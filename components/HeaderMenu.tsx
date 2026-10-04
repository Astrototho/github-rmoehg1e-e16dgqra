'use client';

import { useState } from 'react';
import { Menu as MenuIcon, LogOut, Globe } from 'lucide-react';
import { signOutAction } from '@/app/actions';

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MenuIcon className="w-6 h-6 stroke-[1.5]" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
            <a
              href="https://perfconnect.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Globe className="w-4 h-4" />
              perfconnect.fr
            </a>
            <form action={signOutAction}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
