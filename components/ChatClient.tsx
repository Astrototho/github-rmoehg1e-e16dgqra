'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send } from 'lucide-react';
import { getConversation, sendMessage } from '@/app/actions';
import { MESSAGE_MAX } from '@/lib/constraints';
import type { Message } from '@/lib/types';

// Fréquence de rafraîchissement de la conversation quand l'onglet est visible.
const POLL_INTERVAL_MS = 5000;

interface ChatClientProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  currentUserId: string;
  initialMessages: Message[];
  hadUnread: boolean;
}

export default function ChatClient({
  contactId,
  contactName,
  contactAvatar,
  currentUserId,
  initialMessages,
  hadUnread,
}: ChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);

  const loadMessages = useCallback(async () => {
    const result = await getConversation(contactId);
    if (result.success && result.data) {
      setMessages(result.data);
    } else if (!result.success) {
      setError(result.error);
    }
    setIsLoading(false);
  }, [contactId]);

  // Chargement initial puis rafraîchissement régulier tant que la page est
  // visible (pas de requêtes inutiles quand le téléphone est en veille).
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadMessages();
    }, POLL_INTERVAL_MS);
    const onVisible = () => document.visibilityState === 'visible' && loadMessages();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loadMessages]);

  // Messages marqués comme lus au rendu serveur : on met à jour les badges
  // de la barre de navigation, sans bloquer l'affichage.
  useEffect(() => {
    if (hadUnread) router.refresh();
  }, [hadUnread, router]);

  // Défilement en bas uniquement quand un nouveau message arrive.
  useEffect(() => {
    const last = messages[messages.length - 1]?.id ?? null;
    if (last && last !== lastMessageId.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: lastMessageId.current ? 'smooth' : 'auto',
      });
      lastMessageId.current = last;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError(null);
    const result = await sendMessage(contactId, content);
    setIsSending(false);

    if (result.success && result.data) {
      setNewMessage('');
      setMessages((prev) => [...prev, result.data!]);
    } else if (!result.success) {
      // Le texte reste dans le champ pour pouvoir réessayer.
      setError(result.error);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-8.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] flex-col bg-gray-50">
      <header className="z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-white px-4 shadow-sm">
        <Link
          href="/messages"
          aria-label="Retour aux messages"
          className="-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </Link>
        <Link href={`/users/${contactId}`} className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={contactAvatar}
            alt=""
            className="h-10 w-10 flex-shrink-0 rounded-full border border-gray-100 object-cover"
          />
          <h1 className="truncate font-bold text-gray-900">{contactName}</h1>
        </Link>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        {isLoading ? (
          <div className="mt-10 animate-pulse text-center text-sm text-gray-500">
            Chargement...
          </div>
        ) : messages.length === 0 ? (
          <div className="mt-10 text-center text-sm text-gray-500">
            Envoie un message pour commencer la discussion avec {contactName}.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line break-words rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'rounded-br-sm bg-primary text-white'
                      : 'rounded-bl-sm border border-gray-200 bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t bg-white p-3">
        {error && <p className="mb-2 px-2 text-xs text-red-600">{error}</p>}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            maxLength={MESSAGE_MAX}
            enterKeyHint="send"
            aria-label="Message"
            className="flex-1 rounded-full border-transparent bg-gray-100 px-4 py-2.5 text-sm outline-none transition-colors focus:bg-gray-200 focus:ring-0"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            aria-label="Envoyer"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
