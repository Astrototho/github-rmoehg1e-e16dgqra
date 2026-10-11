// Visuel de l'icône d'application (rendu en PNG par next/og) : le motif à
// points du logo PerfConnect sur fond orange.
const DOTS = [
  { x: 0.62, y: 0.2, r: 0.085 },
  { x: 0.42, y: 0.34, r: 0.075 },
  { x: 0.7, y: 0.44, r: 0.075 },
  { x: 0.26, y: 0.5, r: 0.065 },
  { x: 0.5, y: 0.6, r: 0.065 },
  { x: 0.34, y: 0.76, r: 0.055 },
  { x: 0.62, y: 0.8, r: 0.05 },
];

export default function AppIconImage({ size, padding = 0 }: { size: number; padding?: number }) {
  const inner = size - padding * 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        background: '#F16423',
        position: 'relative',
      }}
    >
      {DOTS.map((dot, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: padding + dot.x * inner - dot.r * inner,
            top: padding + dot.y * inner - dot.r * inner,
            width: dot.r * inner * 2,
            height: dot.r * inner * 2,
            borderRadius: '50%',
            background: '#ffffff',
          }}
        />
      ))}
    </div>
  );
}
