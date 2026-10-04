import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politique de confidentialité — PerfConnect',
};

export default function LegalPage() {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-14 z-40 bg-white border-b px-4 h-14 flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="font-bold text-gray-900">Politique de confidentialité</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-gray-700 leading-relaxed">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs">
          Version bêta — ce document décrit honnêtement les données
          actuellement traitées par l&apos;application, mais n&apos;a pas
          encore été relu par un professionnel du droit. Il ne constitue pas
          une garantie de conformité légale.
        </div>

        <section className="space-y-1">
          <h2 className="font-bold text-gray-900">Données collectées</h2>
          <p>
            Quand tu te connectes avec Strava, nous recevons ton identifiant
            athlète, ton prénom et nom, ta photo de profil, ta ville et ton
            pays (tels que renseignés sur Strava). Si tu autorises l&apos;accès
            à tes activités, nous récupérons également un résumé de tes
            sorties récentes (type de sport, vitesse, durée, dénivelé) pour
            calculer un score de compatibilité avec d&apos;autres membres.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold text-gray-900">Utilisation</h2>
          <p>
            Ces informations servent à créer ton profil, afficher les sorties
            que tu organises ou rejoins, calculer un pourcentage de matching
            avec les autres membres, et te permettre d&apos;échanger des
            messages avec eux.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold text-gray-900">
            Ce que voient les autres membres
          </h2>
          <p>
            Les autres utilisateurs peuvent voir ton nom, ta photo, ta ville,
            les sorties que tu organises, et un pourcentage de matching
            calculé à partir de tes données Strava — jamais tes données
            Strava brutes (vitesse, activités détaillées...).
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold text-gray-900">Stockage</h2>
          <p>
            Tes données sont stockées dans une base de données Supabase,
            accessible uniquement depuis le serveur de l&apos;application.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="font-bold text-gray-900">
            Suppression de tes données
          </h2>
          <p>
            Tu peux supprimer ton compte à tout moment depuis{' '}
            <Link href="/settings" className="text-primary underline">
              Paramètres
            </Link>{' '}
            — ton profil, tes sorties, tes messages, tes notifications et tes
            données de performance sont alors définitivement supprimés.
          </p>
        </section>
      </div>
    </div>
  );
}
