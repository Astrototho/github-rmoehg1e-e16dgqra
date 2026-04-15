'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { getConversation, sendMessage } from '@/app/actions';

export default function ChatPage() {
  // useParams permet de récupérer l'ID dans l'URL (ex: "conv-1")
  const params = useParams();
  const contactId = params.id as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Cette référence sert à faire défiler l'écran tout en bas automatiquement
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MOCK_USER_ID = 'user_strava_mock_123';

  // Pour l'interface, on déduit le nom du contact d'après l'ID de l'URL
  const contactNames: Record<string, string> = {
    'conv-1': 'Sarah',
    'conv-2': 'Julien',
    'conv-3': 'Marie',
  };
  const contactName = contactNames[contactId] || 'Contact';

  // Fonction pour charger l'historique
  const loadMessages = async () => {
    const result = await getConversation(contactId);
    if (result.success && result.data) {
      setMessages(result.data);
    }
    setIsLoading(false);
  };

  // Se lance à l'ouverture de la page
  useEffect(() => {
    loadMessages();
  }, [contactId]);

  // Fait défiler vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fonction appelée quand on clique sur "Envoyer"
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage(''); // On vide le champ immédiatement pour la fluidité de l'interface

    // On envoie à Supabase puis on recharge la liste
    await sendMessage(contactId, content);
    await loadMessages();
  };

  // Hauteur calculée (100vh - header principal - menu du bas) pour que tout s'emboîte parfaitement
  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] bg-gray-50">
      {/* En-tête de la discussion */}
      <header className="bg-white border-b px-4 h-16 flex items-center gap-4 shrink-0 shadow-sm z-10">
        <Link
          href="/messages"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {contactName.charAt(0)}
          </div>
          <h1 className="font-bold text-gray-900">{contactName}</h1>
        </div>
      </header>

      {/* Zone des bulles de messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-10 text-sm animate-pulse">
            Chargement...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10 text-sm">
            Envoyez un message pour commencer la discussion avec {contactName}.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === MOCK_USER_ID;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        {/* Cet élément invisible permet de scroller tout en bas */}
        <div ref={messagesEndRef} />
      </div>

      {/* Barre de saisie */}
      <div className="bg-white border-t p-3 shrink-0">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="flex-1 bg-gray-100 border-transparent focus:bg-gray-200 focus:ring-0 rounded-full px-4 py-2.5 outline-none text-sm transition-colors"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-white p-2.5 rounded-full transition-colors flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
