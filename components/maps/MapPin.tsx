// Repère "point de départ" (SVG), partagé par la carte statique, la carte
// interactive et le sélecteur de point.
export const MAP_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7 0 15.7 0 27.5 16 40 16 40s16-12.5 16-24.3C32 7 24.8 0 16 0z" fill="#F16423" stroke="#fff" stroke-width="2"/><circle cx="16" cy="15.5" r="5.5" fill="#fff"/></svg>`;

export default function MapPin({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'block', width: 32, height: 40, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))' }}
      dangerouslySetInnerHTML={{ __html: MAP_PIN_SVG }}
    />
  );
}
