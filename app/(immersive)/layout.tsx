// Écrans plein écran, sans barre du haut ni barre de navigation
// (accueil / connexion).
export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-gradient-to-b from-brand-50 via-white to-white pt-safe pb-safe shadow-2xl">
      {children}
    </main>
  );
}
