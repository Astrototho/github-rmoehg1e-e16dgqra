# Charte graphique PerfConnect

Référence visuelle de l'app (https://app.perfconnect.fr). Les valeurs ci-dessous
sont mesurées, pas estimées : couleurs échantillonnées sur le logo officiel,
contrastes calculés selon WCAG 2.1. En cas de doute, le code fait foi :

| Source de vérité | Contenu |
|---|---|
| [`lib/brand.ts`](../lib/brand.ts) | Palette (`ORANGE`, `NAVY`, `BRAND_COLORS`), importée par Tailwind, le manifest, le viewport et les SVG inline |
| [`tailwind.config.ts`](../tailwind.config.ts) | Classes `brand-*` (orange) et `navy-*` (marine) |
| [`app/globals.css`](../app/globals.css) | Variables `--primary`, `--foreground`, `--ring`… (composants `ui/`) |
| [`scripts/brand-assets.py`](../scripts/brand-assets.py) | Génération des icônes et du logo détouré à partir du logo source |

---

## 1. Le logo

Deux silhouettes stylisées qui se tiennent : **à gauche en marine, à droite en
orange**. Deux sportifs qui se rejoignent, c'est-à-dire le match.

### Deux versions

| | Symbole seul | Logo complet (symbole + « PerfConnect ») |
|---|---|---|
| Aperçu | les deux silhouettes | les silhouettes, avec « **Perf** » en marine et « **Connect** » en orange en dessous |
| Fichier de travail | `public/brand/logo-mark.png` (699×489, transparent) | `public/brand/logo-wordmark.png` (1097×695, transparent) |
| Original | `public/brand/logo-source.png` (858×678, fond blanc) | `public/brand/logo-wordmark-source.webp` (1254×1254, fond blanc) |
| **Autorisé** | icônes d'app (favicon, écran d'accueil du téléphone, manifest, futures fiches des stores), avatar des comptes PerfConnect sur les réseaux sociaux, icône des notifications push, petites tailles (moins de 120 px de large), filigrane | écran d'accueil et de connexion, page hors connexion, documents (PDF, présentations, e-mails), site vitrine perfconnect.fr, bannières de réseaux sociaux, supports imprimés |
| **Interdit** | lui accoler soi-même le nom « PerfConnect » dans une autre disposition (toute nouvelle composition symbole + nom doit d'abord être validée et ajoutée à cette charte) | **icône d'app** sous toutes ses formes (favicon, `apple-touch-icon`, icônes du manifest, maskable, stores), avatar, **très petites tailles** (moins de 120 px de large à l'écran, moins de 30 mm à l'impression : le nom devient illisible, utiliser le symbole seul), en-tête de l'app (28 px de haut : nom illisible, voir « Logotype de l'en-tête ») |

Le logo complet n'est jamais une icône d'app : un nom en petits caractères est
illisible sur un écran d'accueil et les plateformes affichent déjà le nom de
l'app sous l'icône.

### Fichiers

| Fichier | Usage |
|---|---|
| `public/brand/logo-source.png` | Original du symbole (fond blanc). Ne pas retoucher : icônes et `logo-mark.png` sont régénérés à partir de lui. |
| `public/brand/logo-mark.png` | Symbole détouré, recadré au plus juste. Couleurs exactes uniquement (`#022354`, `#FE5820`). |
| `public/brand/logo-wordmark-source.webp` | Original du logo complet (fond blanc). Ne pas retoucher. |
| `public/brand/logo-wordmark.png` | Logo complet détouré, recadré au plus juste, couleurs exactes (99 % des pixels pleins en `#022354` ou `#FE5820`). |
| `public/logo.png` | Logotype de l'en-tête et de la page hors connexion (ancien motif à points + « PerfConnect »), recoloré en `#FE5820`. Provisoire : à remplacer par une version **horizontale** du logo complet (symbole à gauche, « Perf » marine + « Connect » orange à droite), à dessiner et valider. |
| `app/favicon.ico` | Favicon 16, 32 et 48 px (symbole seul) |
| `public/apple-touch-icon.png` | Icône iOS / Safari, 180×180, opaque (symbole seul) |
| `public/icons/icon-192.png`, `icon-512.png` | Icônes du manifest, `purpose: any` (symbole seul) |
| `public/icons/icon-maskable-512.png` | Icône du manifest, `purpose: maskable`, Android (symbole seul) |

Les icônes sont centrées sur la **boîte englobante des pixels du symbole** (et
non sur la toile d'origine) : l'écart mesuré au centre est de 0,0 px pour tous
les formats.

| Icône | Fond | Largeur du symbole | Remarque |
|---|---|---|---|
| favicon 16/32/48 | pastille blanche, coins arrondis 20 %, coins transparents | 86 % | une image dessinée par taille, pas de réduction automatique |
| `any` 192 / 512 | pastille blanche, coins arrondis 22,4 %, coins transparents | 74 % | installation sur ordinateur, Firefox, écran de lancement |
| `apple-touch-icon` 180 | blanc plein, **opaque** | 74 % | iOS arrondit lui-même les coins ; une transparence deviendrait noire |
| `maskable` 512 | blanc plein, opaque | 65 % | tous les pixels du logo à moins de 34 % du centre, dans la zone sûre (cercle de 80 % de diamètre, soit 40 % de rayon) |

Pour régénérer après un changement de logo :

```bash
python3 scripts/brand-assets.py
```

Remplacer d'abord l'original concerné dans `public/brand/`, puis incrémenter
`CACHE_VERSION` dans `public/sw.js` (le logo de l'en-tête et l'icône 192 sont
précachés pour la page hors connexion).

### Couleurs et proportions du logo complet

Échantillonnées sur `logo-wordmark-source.webp` : symbole et texte ont les
**mêmes couleurs que le symbole seul** (marine `#022355`, orange `#FE5920` /
`#FD5921`, soit au plus 1 niveau d'écart par canal, dû à la compression WebP).

- « **Perf** » : marine `#022354` (`navy-900`). « **Connect** » : orange
  `#FE5820` (`brand-500`). Toujours ces deux couleurs, dans cet ordre, comme
  les deux silhouettes.
- Le symbole est centré au-dessus du nom et fait 63,5 % de sa largeur.
- Espace entre le bas du symbole et le haut du nom : environ ½ x (x défini
  ci-dessous) ; hauteur du nom : environ 1 x.

### Zone de protection

Unité **x = diamètre d'une tête** des silhouettes (≈ 19 % de la largeur du
symbole, ≈ 27 % de sa hauteur). Laisser **au moins x d'espace vide** tout autour
du symbole ou du logo complet : pas de texte, de bord d'écran ni d'autre logo
dans cette zone.

Exception : dans les icônes d'app et le favicon, les marges suivent les gabarits
des plateformes (tableau ci-dessus).

### Tailles minimales

| Support | Minimum |
|---|---|
| Symbole seul, écran | 24 px de large (en dessous, l'espace entre les mains se bouche) |
| Symbole seul, favicon | 16 px, toujours sur sa pastille blanche |
| Symbole seul, impression | 12 mm de large |
| Logo complet, écran | 120 px de large (nom ≈ 15 px de haut) ; en dessous, symbole seul |
| Logo complet, impression | 30 mm de large |
| Logotype de l'en-tête (provisoire) | 28 px de haut (`h-7`) |

### Fonds autorisés

Blanc, ou fond très clair (`gray-50`, `navy-50`, `brand-50`). Sur un fond
sombre, coloré ou une photo, le symbole ou le logo complet est **toujours posé
sur une pastille ou un cartouche blanc** : le marine disparaît sur fond sombre
(contraste 1,05:1 avec le gris `#202124` des onglets sombres de Chrome).

### Usages interdits (les deux versions)

- Changer, éclaircir ou inverser les couleurs des silhouettes ou du nom (le
  marine reste à gauche et sur « Perf », l'orange à droite et sur « Connect »).
  Il n'existe pas encore de version monochrome officielle.
- Étirer, écraser, incliner, pivoter ou mettre en miroir le logo.
- Ajouter une ombre, un contour, un dégradé, une texture ou un effet 3D.
- Recadrer ou couper une silhouette, séparer les deux silhouettes ou modifier
  leur disposition ; déplacer, agrandir ou réduire le nom par rapport au
  symbole.
- Recomposer le nom avec une police (même la plus proche, voir § 3) : toujours
  utiliser les fichiers du logo.
- Poser le logo sans pastille blanche sur un fond sombre, orange, marine ou
  sur une photo.
- Utiliser un original à fond blanc (bruité) là où un fond transparent est
  nécessaire : prendre `logo-mark.png` ou `logo-wordmark.png`.
- Associer le logo à celui de Strava (voir § 5) ou l'utiliser dans un bouton
  Strava.

---

## 2. Palette

### Couleurs de marque

| Rôle | Nom | Hex | RGB | Tailwind | Contraste sur blanc |
|---|---|---|---|---|---|
| **Primaire, logo** | Orange PerfConnect | `#FE5820` | 254, 88, 32 | `brand-500` | 3,17:1 |
| **Primaire, actions** | Orange action | `#CD3C00` | 205, 60, 0 | `brand-600`, `primary` | 4,95:1 |
| **Secondaire, logo** | Marine PerfConnect | `#022354` | 2, 35, 84 | `navy-900`, `foreground` | 15,32:1 |

Ces deux couleurs du logo ont été échantillonnées au cœur des formes (médiane
de plus de 60 000 pixels par couleur, écart-type < 1 par canal).

- **Orange `#FE5820` (brand-500)** : couleur du logo et de l'énergie du match.
  Graphismes uniquement : anneau de match, épingle de carte, tracé de
  l'illustration d'accueil, anneau de focus, points et puces. À 3,17:1, il
  **n'est pas assez contrasté pour du texte courant** ni pour un bouton à texte
  blanc. Il n'est admis comme texte qu'à partir de 24 px (ou 18,7 px gras).
- **Orange action `#CD3C00` (brand-600)** : boutons primaires (texte blanc
  4,95:1), liens et texte orange, onglet actif, bulles de chat envoyées,
  encadré « % match ». Il reste AA sur `gray-50` (4,74:1) et `brand-50`
  (4,59:1).
- **Marine `#022354` (navy-900)** : titres et texte principal, surfaces sombres
  (bandeau « Vois ton % de match » des visiteurs, bandeau de mise à jour,
  info-bulles), barres d'effort,
  contour de focus, barre d'état et barre de titre de l'app installée
  (`theme_color`, `themeColor` du viewport).

### Échelles complètes

Dérivées des deux couleurs du logo en OKLCH (même teinte, luminosité variable).

**Orange (`brand-*`)**

| Teinte | Hex | RGB | Sur blanc | Usage |
|---|---|---|---|---|
| 50 | `#FFF4F1` | 255, 244, 241 | — | fond des boutons tonaux, badges neutres, encarts |
| 100 | `#FFE7E0` | 255, 231, 224 | — | survol des boutons tonaux, dégradé de la carte sans point |
| 200 | `#FFCEBF` | 255, 206, 191 | — | contour des badges neutres |
| 300 | `#FFAF97` | 255, 175, 151 | — | réserve |
| 400 | `#FF8764` | 255, 135, 100 | — | réserve |
| **500** | **`#FE5820`** | 254, 88, 32 | 3,17:1 | **logo**, graphismes |
| **600** | **`#CD3C00`** | 205, 60, 0 | 4,95:1 | **boutons, texte orange** |
| 700 | `#B63500` | 182, 53, 0 | 6,00:1 | texte sur fond teinté (`brand-50` 5,56:1, `brand-100` 5,08:1), survol des boutons primaires, date de la sortie |
| 800 | `#8F2700` | 143, 39, 0 | 8,54:1 | texte des badges neutres (7,92:1 sur `brand-50`) |
| 900 | `#721E00` | 114, 30, 0 | 11,05:1 | réserve |

**Marine (`navy-*`)**

| Teinte | Hex | RGB | Sur blanc | Usage |
|---|---|---|---|---|
| 50 | `#F0F6FD` | 240, 246, 253 | — | encarts d'information (disponible) |
| 100 | `#E0EAFB` | 224, 234, 251 | — | pastilles des « autres sportifs » dans l'illustration d'accueil |
| 200 | `#C3D6F2` | 195, 214, 242 | — | réserve |
| 300 | `#99B6E1` | 153, 182, 225 | — | réserve |
| 400 | `#688DC6` | 104, 141, 198 | 3,38:1 | réserve |
| 500 | `#426CAB` | 66, 108, 171 | 5,30:1 | réserve |
| 600 | `#275191` | 39, 81, 145 | 7,86:1 | réserve |
| 700 | `#163E79` | 22, 62, 121 | 10,50:1 | réserve |
| 800 | `#0C2F63` | 12, 47, 99 | 13,11:1 | réserve |
| **900** | **`#022354`** | 2, 35, 84 | 15,32:1 | **logo**, titres, texte, surfaces sombres |

### Fonds

| Fond | Hex | Usage |
|---|---|---|
| Blanc | `#FFFFFF` | conteneur de l'app, cartes, barres du haut et du bas, icônes, écran de lancement (`background_color`) |
| `gray-50` | `#F9FAFB` | fond de page autour du conteneur, bloc des statistiques des cartes |
| `gray-100` | `#F3F4F6` | boutons secondaires, piste de l'anneau de match |
| `brand-50` | `#FFF4F1` | boutons tonaux, badges et encarts orange |
| `navy-50` / `navy-100` | `#F0F6FD` / `#E0EAFB` | encarts d'information, illustrations |

L'app n'a pas de thème sombre : le bloc `.dark` de `globals.css` n'est utilisé
nulle part.

### Textes

| Rôle | Couleur | Contraste |
|---|---|---|
| Titres, texte principal | `navy-900` `#022354` | 15,32:1 sur blanc, 14,66:1 sur `gray-50` |
| Texte courant secondaire | `gray-700` `#374151` / `gray-800` | 10,31:1 |
| Texte d'appoint, légendes | `gray-600` `#4B5563` | 7,56:1 |
| Texte le plus clair autorisé | `gray-500` `#6B7280` | 4,83:1 (4,63:1 sur `gray-50`) |
| Texte orange | `brand-600` (fond blanc ou `gray-50`), `brand-700` (fond teinté) | ≥ 4,5:1 |

### États

| État | Fond / texte | Contraste du texte |
|---|---|---|
| Succès (« Tu participes ») | `green-50` / `green-800`, contour `green-200` | 6,81:1 |
| En attente (« Demande envoyée ») | `amber-50` / `amber-800`, contour `amber-200` | 6,84:1 |
| Imminent (sortie bientôt) | texte `amber-700` + point `amber-500` animé | 5,02:1 |
| Erreur, annulée | `red-50` / `red-700`, contour `red-200` | 5,91:1 |
| Sortie annulée (carte) | `opacity-60` + `grayscale` + date barrée | — |
| Compteur non lu | `red-600` + texte blanc, bord blanc 2 px | 4,83:1 |
| Désactivé | `opacity-50` ou `opacity-60` | — |
| Survol d'un bouton primaire | `brand-700` (plus foncé, jamais plus clair : `bg-primary/90` passerait sous 4,5:1) | 6,00:1 |
| Focus clavier | anneau `ring-2 ring-brand-500` (cartes) ou contour `outline-navy-900` | ≥ 3:1 (éléments non textuels) |

### Règles de contraste (AA)

- Texte < 24 px (< 18,7 px gras) : **4,5:1 minimum**. Texte plus grand et
  éléments graphiques porteurs de sens (icônes seules, contours de champs,
  anneaux de focus) : **3:1 minimum**.
- Texte blanc sur orange : uniquement sur `brand-600` ou plus foncé, jamais sur
  `brand-500`.
- Texte orange sur fond orange teinté : `brand-700` ou `brand-800`.
- Marine sur orange `#FE5820` : 4,84:1, AA possible, mais réservé aux
  illustrations (pas de bouton orange à texte marine).
- Zones tactiles ≥ 44 px (voir CLAUDE.md, « Mobile »).

---

## 3. Typographie

**Inter** (Google Fonts via `next/font/google`, sous-ensemble `latin`), chargée
dans [`app/layout.tsx`](../app/layout.tsx) et appliquée à tout le `<body>`.
`public/offline.html` et `app/global-error.tsx` s'affichent sans la police web :
ils utilisent `system-ui`.

| Rôle | Style | Exemple |
|---|---|---|
| Titre d'accueil | 28 px, `font-black` (900), interligne 1,15, `tracking-tight` | « Trouve tes partenaires de sortie, à ton niveau. » |
| Titre d'écran | `text-2xl` (24 px), `font-black` | Messages, Notifications, Mes Sorties, Paramètres |
| Titre du fil | `text-xl` (20 px), `font-black`, `tracking-tight` | Sorties à venir |
| Titre de section | 16–18 px, `font-bold` (700) | Organisateur, Description |
| Titre de carte de sortie | 17 px, `font-bold`, `leading-snug`, 2 lignes max | titre de la sortie |
| Corps | `text-sm` (14 px) ou `text-base` (16 px), regular | descriptions, messages |
| Boutons, libellés | `text-sm`, `font-semibold` (600) ou `font-bold` | Demander à participer, Filtres |
| Micro-libellés | 10–11 px, `font-bold`, majuscules, interlettrage élargi | onglets de la barre du bas, « MATCH » |
| Chiffres | `font-extrabold` (800) ou `font-black`, `tabular-nums` | km, m D+, durée, % |

Règles :

- Graisses utilisées : 400, 500, 600, 700, 800, 900. Aucun italique dans l'interface.
- Les champs de saisie font 16 px minimum sur téléphone (sinon iOS zoome).
- Interface en français, tutoiement (« Trouve tes partenaires », « Connecte-toi »).

### Lettrage du logo

Le nom « PerfConnect » du logo complet est une **image**, pas du texte composé :
sans-serif géométrique grasse, « C » presque circulaire, « t » à sommet plat,
terminaisons de « e », « c » et « C » coupées en biais, « f » étroit, grand œil
et approche serrée. La police la plus proche identifiée visuellement est
**Montserrat Bold (700)** (libre, Google Fonts) ; Gotham Bold est une
alternative commerciale proche. Identification visuelle seulement : le lettrage
ne correspond exactement à aucune police connue.

- Montserrat **n'est pas chargée dans l'app** et ne doit pas l'être pour
  l'interface, qui reste en Inter.
- Elle peut servir, hors app, à composer un titre marketing qui doit
  s'harmoniser avec le logo, jamais à recomposer le logo lui-même.

---

## 4. Composants clés

### Boutons

| Variante | Classes | Usage |
|---|---|---|
| Primaire | `rounded-xl bg-primary py-3.5 font-bold text-white hover:bg-brand-700 disabled:opacity-50` (`rounded-2xl py-4 shadow-lg shadow-primary/20` pour « Demander à participer ») | action principale de l'écran (Demander à participer, Publier ma sortie) |
| Bouton « + » central | `rounded-2xl bg-primary p-3 text-white shadow-lg shadow-primary/30` | Proposer une sortie (barre du bas) |
| Tonal | `rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 hover:bg-brand-100` | actions secondaires mises en avant (Contacter, Modifier, Installer l'app, Activer les notifications, Reconnecter Strava) |
| Secondaire | `rounded-xl bg-gray-100 text-sm font-semibold text-navy-900` | actions neutres (Utiliser ma position actuelle) |
| Sombre | `rounded-2xl bg-navy-900 text-white` (+ bouton blanc à texte marine) | bandeaux : « Vois ton % de match » (visiteurs), mise à jour de l'app |
| Lien | `text-primary`, souligné au survol | liens dans le texte |
| Refus | `bg-red-500 text-white` (icône seule) | refuser un participant |

Hauteur minimale 44 px. Une seule action primaire par écran.

### Carte de sortie ([`components/ActivityCard.tsx`](../components/ActivityCard.tsx))

- Conteneur : `rounded-3xl bg-white`, ombre douce, `ring-1 ring-gray-900/5`,
  léger rétrécissement au toucher (`active:scale-[.99]`).
- En-tête (144 px) : carte du **point de départ** (tuiles OSM), ou dégradé
  `brand-100 → brand-50` avec l'emoji du sport si le point n'est pas placé.
  Pastilles blanches `bg-white/95` : sport (en haut à gauche), distance depuis
  toi (en bas à droite).
- Organisateur : avatar entouré de l'**anneau de match** (piste `gray-100`,
  progression `brand-500` proportionnelle au % ; pointillés `gray-300` quand le %
  est inconnu), qui chevauche la carte.
- Date relative en `brand-700` gras (« Demain · 8h30 »), en `amber-700` avec un
  point animé quand la sortie est imminente.
- Titre en `navy-900`, lieu en `gray-600`, statistiques km / D+ / durée sur fond
  `gray-50`, barres d'effort en `navy-900`.

### Encadré « % match »

La donnée clé, visible au premier coup d'œil, en haut à droite de la carte :

- `rounded-2xl bg-brand-600 px-3.5 py-2 text-white shadow-lg ring-2 ring-white`
- Chiffre 34 px `font-black` `tabular-nums`, signe « % » 18 px `font-extrabold`,
  libellé « MATCH » 10 px gras en majuscules, interlettrage 0,12 em, **blanc
  plein** (pas `text-white/90`, qui passerait sous 4,5:1).
- % indisponible : même encadré en `bg-white/95 text-gray-500`, « – % » (profil
  absent) ou « ?? % » avec un cadenas (visiteur non connecté).
- Le % n'est jamais montré à l'organisateur pour un participant (donnée dérivée
  de Strava d'un autre utilisateur, voir CLAUDE.md).

### Badges

`flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-bold ring-1`, avec
une icône de 14 px facultative :

| Ton | Classes |
|---|---|
| Neutre | `bg-brand-50 text-brand-800 ring-brand-200` |
| Succès | `bg-green-50 text-green-800 ring-green-200` (icône ✓) |
| En attente | `bg-amber-50 text-amber-800 ring-amber-200` (icône horloge) |
| Danger | `bg-red-50 text-red-700 ring-red-200` |

Compteurs de non-lus : pastille `bg-red-600`, texte blanc 10 px gras, bord blanc
de 2 px, « 9+ » au-delà de 9.

### Carte et illustration

- Épingle de point de départ (`MAP_PIN_SVG`, [`components/maps/MapPin.tsx`](../components/maps/MapPin.tsx)) :
  goutte `#FE5820`, contour blanc 2 px, point blanc, ombre portée.
- Illustration d'accueil ([`components/welcome/WelcomeHero.tsx`](../components/welcome/WelcomeHero.tsx)) :
  reprend le duo du logo. Toi en orange plein, les autres sportifs en
  `navy-100` avec initiales marine, tracé orange en pointillés, courbes de
  niveau marine à 10 % d'opacité, pastilles de % en `brand-700`.

---

## 5. Marque Strava : à ne pas modifier

Les fichiers officiels du pack de marque Strava sont dans `public/strava/` et
s'utilisent **tels quels** (règles : https://developers.strava.com/guidelines/).

| Élément | Fichier | Où |
|---|---|---|
| Bouton « Connect with Strava » (orange) | `public/strava/btn_strava_connect_with_orange.svg` | écran de connexion ([`StravaConnectButton`](../components/welcome/StravaConnectButton.tsx)), 48 px de haut |
| Logo « Powered by Strava » (horizontal, orange) | `public/strava/api_logo_pwrdBy_strava_horiz_orange.svg` | connexion et Paramètres ([`PoweredByStrava`](../components/PoweredByStrava.tsx)) |

Règles :

- Ne jamais modifier, recolorer, recadrer, déformer ni animer ces logos. Le
  bouton existe en orange ou en blanc uniquement, 48 px de haut (96 px en 2×).
- Le bouton « Connect with Strava » mène à l'autorisation OAuth de Strava
  (`https://www.strava.com/oauth/authorize`).
- « Powered by Strava » reste **séparé** du logo PerfConnect et **moins visible**
  que lui (aujourd'hui 16 px de haut).
- Ne jamais utiliser une partie d'un logo Strava comme icône de l'app, ni le
  nom « Strava » dans le nom de l'app ; ne jamais laisser entendre que Strava a
  développé, sponsorisé ou approuvé PerfConnect.
- Un lien vers une donnée Strava d'origine s'intitule « View on Strava » : gras,
  souligné ou orange `#FC5200`.
- **L'orange Strava `#FC5200` est différent du nôtre (`#FE5820`)**, même s'ils
  sont proches. Ne jamais recolorer un élément Strava avec la palette
  PerfConnect, ni utiliser `#FC5200` dans l'interface PerfConnect.
