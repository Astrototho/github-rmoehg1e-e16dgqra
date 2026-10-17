import { BRAND_COLORS, NAVY, ORANGE } from '@/lib/brand';

// Illustration de l'écran d'accueil : courbes de niveau, tracé d'une sortie
// et membres fictifs avec leur % de match (SVG inline, aucune requête réseau).
// Comme dans le logo : toi en orange, les autres sportifs en marine.

const CONTOURS = [
  'M-20 250 C 60 200, 120 230, 190 190 S 330 150, 400 175',
  'M-20 225 C 70 175, 130 205, 200 165 S 330 125, 400 148',
  'M-20 198 C 80 150, 140 178, 210 140 S 335 100, 400 120',
  'M-20 170 C 90 128, 150 152, 220 116 S 340 78, 400 94',
  'M-20 140 C 100 104, 160 126, 230 92 S 345 56, 400 68',
  'M-20 110 C 110 80, 170 100, 240 70 S 350 36, 400 44',
  'M-20 80 C 120 58, 180 74, 250 48 S 355 18, 400 22',
];

const PINS = [
  { x: 62, y: 214, label: 'JM', match: '87 %', delay: '0ms' },
  { x: 168, y: 150, label: 'Toi', me: true, delay: '120ms' },
  { x: 262, y: 104, label: 'LS', match: '92 %', delay: '240ms' },
  { x: 330, y: 196, label: 'AK', delay: '360ms' },
];

export default function WelcomeHero() {
  return (
    <svg
      viewBox="0 0 375 300"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Des sportifs reliés par le tracé d'une sortie, avec leur pourcentage de match"
    >
      <g fill="none" stroke={BRAND_COLORS.navy} strokeOpacity=".1" strokeWidth="1.5">
        {CONTOURS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path
        d="M62 214 C 100 190, 130 170, 168 150 S 230 112, 262 104 S 320 150, 330 196"
        fill="none"
        stroke={BRAND_COLORS.orange}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 7"
        className="welcome-trace"
      />
      {PINS.map((pin) => (
        <g key={pin.label} className="welcome-pin" style={{ animationDelay: pin.delay }}>
          <circle
            cx={pin.x}
            cy={pin.y}
            r="20"
            fill={pin.me ? BRAND_COLORS.orange : NAVY[100]}
            stroke="#fff"
            strokeWidth="3"
          />
          <text
            x={pin.x}
            y={pin.y + 5}
            textAnchor="middle"
            fontSize={pin.me ? 12 : 13}
            fontWeight="800"
            fill={pin.me ? '#fff' : BRAND_COLORS.navy}
          >
            {pin.label}
          </text>
          {pin.match && (
            <g>
              <rect
                x={pin.x + 12}
                y={pin.y - 40}
                width="52"
                height="24"
                rx="12"
                fill="#fff"
                stroke={ORANGE[200]}
              />
              <text
                x={pin.x + 38}
                y={pin.y - 23.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill={ORANGE[700]}
              >
                {pin.match}
              </text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
