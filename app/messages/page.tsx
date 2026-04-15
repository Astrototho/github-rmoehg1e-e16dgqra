import { Search, Edit } from 'lucide-react';
import Link from 'next/link';

// Fausses données pour visualiser le design avant de connecter Supabase
const mockConversations = [
  {
    id: 'conv-1',
    contactName: 'Sarah',
    contactAvatar: 'https://i.pravatar.cc/150?u=sarah',
    lastMessage: 'Super, on se retrouve au parking à 9h alors !',
    time: '10:30',
    unread: 2,
  },
  {
    id: 'conv-2',
    contactName: 'Julien',
    contactAvatar: 'https://i.pravatar.cc/150?u=julien',
    lastMessage: 'Tu prends ton VTT ou le gravel ?',
    time: 'Hier',
    unread: 0,
  },
  {
    id: 'conv-3',
    contactName: 'Marie',
    contactAvatar: 'https://i.pravatar.cc/150?u=marie',
    lastMessage: "Merci pour la sortie, c'était top !",
    time: 'Lun.',
    unread: 0,
  },
];

export default function MessagesPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* En-tête */}
      <div className="px-4 py-6 border-b border-gray-100 flex items-center justify-between sticky top-14 bg-white/90 backdrop-blur-md z-40">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          <p className="text-gray-500 text-sm mt-1">Tes discussions en cours</p>
        </div>
        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700">
          <Edit className="w-5 h-5" />
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une discussion..."
            className="w-full pl-11 pr-4 py-3 bg-gray-100 border-transparent focus:bg-white focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {mockConversations.map((conv) => (
          <Link
            href={`/messages/${conv.id}`}
            key={conv.id}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={conv.contactAvatar}
                alt={conv.contactName}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
              />
              {/* Point vert pour simuler qu'il est en ligne */}
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3
                  className={`text-base truncate ${
                    conv.unread > 0
                      ? 'font-bold text-gray-900'
                      : 'font-semibold text-gray-700'
                  }`}
                >
                  {conv.contactName}
                </h3>
                <span
                  className={`text-xs flex-shrink-0 ml-2 ${
                    conv.unread > 0 ? 'text-primary font-bold' : 'text-gray-400'
                  }`}
                >
                  {conv.time}
                </span>
              </div>
              <p
                className={`text-sm truncate ${
                  conv.unread > 0
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {conv.lastMessage}
              </p>
            </div>

            {/* Badge non lu */}
            {conv.unread > 0 && (
              <div className="w-5 h-5 bg-primary text-white text-xs font-bold flex items-center justify-center rounded-full flex-shrink-0">
                {conv.unread}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
