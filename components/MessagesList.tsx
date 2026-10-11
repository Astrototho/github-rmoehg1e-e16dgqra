'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import type { ConversationPreview } from '@/lib/types';

interface MessagesListProps {
  conversations: ConversationPreview[];
}

export default function MessagesList({ conversations }: MessagesListProps) {
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();
  const filtered = trimmed
    ? conversations.filter((c) => c.contactName.toLowerCase().includes(trimmed))
    : conversations;

  return (
    <>
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une discussion..."
            className="w-full pl-11 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-sm transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-gray-400 text-sm">
              Aucune conversation pour le moment.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Contacte un organisateur depuis une sortie pour démarrer une
              discussion.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-gray-400 text-sm">
              Aucun résultat pour « {query} ».
            </p>
          </div>
        ) : (
          filtered.map((conv) => (
            <Link
              href={`/messages/${conv.contactId}`}
              key={conv.contactId}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={conv.contactAvatar}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                />
                {conv.unread && (
                  <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3
                    className={`text-base truncate ${
                      conv.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'
                    }`}
                  >
                    {conv.contactName}
                  </h3>
                  <span className="text-xs flex-shrink-0 ml-2 text-gray-400">
                    {conv.time}
                  </span>
                </div>
                <p
                  className={`text-sm truncate ${
                    conv.unread ? 'font-medium text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {conv.lastMessage}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
