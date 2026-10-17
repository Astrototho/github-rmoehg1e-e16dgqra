'use client';

import { BRAND_COLORS, ORANGE } from '@/lib/brand';

// Filet de sécurité si le layout racine lui-même plante.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 24,
          color: BRAND_COLORS.navy,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>
            PerfConnect est momentanément indisponible
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Réessaie dans quelques instants.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 16,
              padding: '12px 20px',
              borderRadius: 12,
              border: 0,
              background: ORANGE[600],
              color: '#fff',
              fontWeight: 700,
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
