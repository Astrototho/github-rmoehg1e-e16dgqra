// Illustration de l'écran d'accueil : courbes de niveau, tracé d'une sortie
// et membres fictifs avec leur % de match (SVG inline, aucune requête réseau).

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
      <g fill="none" stroke="#F16423" strokeOpacity=".14" strokeWidth="1.5">
        {CONTOURS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path
        d="M62 214 C 100 190, 130 170, 168 150 S 230 112, 262 104 S 320 150, 330 196"
        fill="none"
        stroke="#F16423"
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
            fill={pin.me ? '#F16423' : '#FFE6D5'}
            stroke="#fff"
            strokeWidth="3"
          />
          <text
            x={pin.x}
            y={pin.y + 5}
            textAnchor="middle"
            fontSize={pin.me ? 12 : 13}
            fontWeight="800"
            fill={pin.me ? '#fff' : '#9A3412'}
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
                stroke="#FFE6D5"
              />
              <text
                x={pin.x + 38}
                y={pin.y - 23.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="800"
                fill="#C2410C"
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
