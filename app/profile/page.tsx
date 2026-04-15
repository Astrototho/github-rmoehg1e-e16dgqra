import { Settings, Grid, Map, Edit3, Share } from 'lucide-react';
import Link from 'next/link';

// Fausses données de profil
const mockUser = {
  name: 'Thomas (Test)',
  username: '@thomas_trail',
  avatar: 'https://github.com/shadcn.png',
  bio: '🏔️ Amoureux de la montagne\n🏃‍♂️ Trail & Route\n📍 Basé à Grenoble\nDispo le week-end pour des sorties longues !',
  stats: {
    activities: 24,
    followers: 128,
    following: 85,
  },
};

// Fausses photos pour la grille (type Instagram)
const mockGridPhotos = [
  'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=400&auto=format&fit=crop', // Trail
  'https://images.unsplash.com/photo-1541625602330-2277a4c4618c?q=80&w=400&auto=format&fit=crop', // Velo
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop', // Paysage
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop', // Sommet
  'https://images.unsplash.com/photo-1502224562085-639556652f33?q=80&w=400&auto=format&fit=crop', // Course route
  'https://images.unsplash.com/photo-1511994298241-608e28f14fde?q=80&w=400&auto=format&fit=crop', // VTT
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* En-tête (Top Bar) */}
      <header className="px-4 h-14 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-40">
        <h1 className="text-xl font-bold text-gray-900">{mockUser.username}</h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Settings className="w-6 h-6 text-gray-900" />
        </button>
      </header>

      <div className="overflow-y-auto pb-6">
        {/* Section Infos Profil */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Avatar */}
            <div className="relative">
              <img
                src={mockUser.avatar}
                alt={mockUser.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            </div>

            {/* Stats (Sorties, Abonnés, Abonnements) */}
            <div className="flex gap-6 mr-2 text-center">
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900">
                  {mockUser.stats.activities}
                </span>
                <span className="text-xs text-gray-500">Sorties</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900">
                  {mockUser.stats.followers}
                </span>
                <span className="text-xs text-gray-500">Abonnés</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900">
                  {mockUser.stats.following}
                </span>
                <span className="text-xs text-gray-500">Suivis</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <h2 className="font-bold text-gray-900">{mockUser.name}</h2>
            <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
              {mockUser.bio}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              <Edit3 className="w-4 h-4" /> Modifier
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
              <Share className="w-4 h-4" /> Partager
            </button>
          </div>
        </div>

        {/* Séparateur / Onglets type Instagram */}
        <div className="flex border-t border-gray-100 mt-2">
          <div className="flex-1 border-t-2 border-gray-900 flex justify-center py-3">
            <Grid className="w-6 h-6 text-gray-900" />
          </div>
          <div className="flex-1 flex justify-center py-3">
            <Map className="w-6 h-6 text-gray-400" />
          </div>
        </div>

        {/* Grille de photos (3 colonnes) */}
        <div className="grid grid-cols-3 gap-1">
          {mockGridPhotos.map((photo, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-200 relative group cursor-pointer"
            >
              <img
                src={photo}
                alt={`Post ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Effet au survol (optionnel, plus sympa sur desktop) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
