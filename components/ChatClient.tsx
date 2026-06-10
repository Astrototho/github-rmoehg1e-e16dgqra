'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { getConversation, sendMessage } from '@/app/actions';

interface ChatClientProps {
  contactId: string;
  contactName: string;
  contactAvatar: string;
  currentUserId: string;
}

export default function ChatClient({
  contactId,
  contactName,
  contactAvatar,
  currentUserId,
}: ChatClientProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const result = await getConversation(contactId);
    if (result.success && result.data) {
      setMessages(result.data);
    }
    setIsLoading(false);
  }, [contactId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');

    await sendMessage(contactId, content);
    await loadMessages();
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] bg-gray-50">
      <header className="bg-white border-b px-4 h-16 flex items-center gap-4 shrink-0 shadow-sm z-10">
        <Link
          href="/messages"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div className="flex items-center gap-3">
          <img
            src={contactAvatar}
            alt={contactName}
            className="w-10 h-10 rounded-full object-cover border border-gray-100"
          />
          <h1 className="font-bold text-gray-900">{contactName}</h1>
        </div>
      </header>

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
            const isMe = msg.sender_id === currentUserId;
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
        <div ref={messagesEndRef} />
      </div>

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
