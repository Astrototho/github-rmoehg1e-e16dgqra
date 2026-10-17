// Couleurs de marque PerfConnect, échantillonnées sur le logo officiel
// (public/brand/logo-source.png) : orange #FE5820 et marine #022354. Les
// autres teintes sont dérivées en OKLCH (même teinte). Source unique :
// tailwind.config.ts, le manifest, le viewport et les SVG/styles inline
// importent ces valeurs. Rôles et contrastes : docs/charte-graphique.md.
//
// Contrastes sur blanc : orange-500 3,2:1 (graphismes et grands textes
// seulement), orange-600 4,95:1 (boutons, texte), orange-700 6:1 (texte
// sur fond teinté brand-50/100), marine-900 15,3:1.

export const ORANGE = {
  50: '#FFF4F1',
  100: '#FFE7E0',
  200: '#FFCEBF',
  300: '#FFAF97',
  400: '#FF8764',
  500: '#FE5820', // logo
  600: '#CD3C00', // boutons et texte orange (AA, y compris sur gray-50)
  700: '#B63500',
  800: '#8F2700',
  900: '#721E00',
} as const;

export const NAVY = {
  50: '#F0F6FD',
  100: '#E0EAFB',
  200: '#C3D6F2',
  300: '#99B6E1',
  400: '#688DC6',
  500: '#426CAB',
  600: '#275191',
  700: '#163E79',
  800: '#0C2F63',
  900: '#022354', // logo
} as const;

export const BRAND_COLORS = {
  orange: ORANGE[500],
  navy: NAVY[900],
  white: '#FFFFFF',
} as const;
