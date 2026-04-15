import PropositionForm from '@/components/PropositionForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateActivityPage() {
  return (
    <div className="p-4 space-y-6">
      {/* Header local pour la création */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-black">Proposer une sortie</h1>
      </div>

      <div className="bg-white rounded-3xl">
        <PropositionForm />
      </div>

      <p className="text-center text-xs text-gray-400 px-8">
        Ta sortie sera visible immédiatement par tous les membres de la
        communauté.
      </p>
    </div>
  );
}
