#!/usr/bin/env python3
"""Génère les icônes de l'app et les logos détourés à partir des logos officiels.

Sources (fond blanc) :
- public/brand/logo-source.png : symbole seul (~858×678), utilisé pour toutes
  les icônes d'app ;
- public/brand/logo-wordmark-source.webp : symbole + « PerfConnect »
  (1254×1254), détouré seulement, jamais utilisé comme icône.
Les fichiers produits sont commités : ce script ne tourne pas au build, il
suffit de le relancer si le logo change (puis d'incrémenter CACHE_VERSION
dans public/sw.js).

    python3 -m pip install pillow numpy
    python3 scripts/brand-assets.py

Étapes :
1. Détourage : chaque pixel est décomposé en mélange de blanc, de marine et
   d'orange (couleurs exactes du logo) -> logo sur fond transparent, bords
   anticrénelés propres, sans le bruit du fond blanc d'origine.
2. Centrage : sur la boîte englobante des pixels non blancs (alpha > 0,1),
   pas sur la toile d'origine. Redimensionnement Lanczos avec position au
   sous-pixel près.
3. Rendu de chaque format (voir ICONS).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'public/brand/logo-source.png'
WORDMARK_SOURCE = ROOT / 'public/brand/logo-wordmark-source.webp'

# Couleurs échantillonnées au cœur des formes du logo (médiane, écart-type < 1).
NAVY = (2, 35, 84)  # #022354
ORANGE = (254, 88, 32)  # #FE5820
WHITE = 255.0

ALPHA_NOISE = 0.06  # en dessous : bruit du fond blanc (pixels 245–255)
ALPHA_SOLID = 0.97
BBOX_ALPHA = 0.1  # « pixel non blanc » pour la boîte englobante
SUPERSAMPLE = 8  # anticrénelage des coins arrondis


def unmix(rgb: np.ndarray) -> np.ndarray:
    """Pixel = a·marine + b·orange + (1 − a − b)·blanc -> RGBA prémultiplié."""
    d = rgb - WHITE  # (H, W, 3)
    n = np.array(NAVY, float) - WHITE
    o = np.array(ORANGE, float) - WHITE
    # Moindres carrés à deux inconnues (a, b).
    nn, oo, no = n @ n, o @ o, n @ o
    dn, do = d @ n, d @ o
    det = nn * oo - no * no
    a = (dn * oo - do * no) / det
    b = (do * nn - dn * no) / det
    # Composante négative ou très minoritaire (bruit) : une seule couleur.
    only_o = a < 0.1 * np.abs(b)
    only_n = ~only_o & (b < 0.1 * np.abs(a))
    a = np.where(only_o, 0, np.where(only_n, dn / nn, a))
    b = np.where(only_n, 0, np.where(only_o, do / oo, b))
    a, b = np.clip(a, 0, 1), np.clip(b, 0, 1)
    alpha = a + b
    norm = np.maximum(alpha, 1)  # a + b > 1 : on ramène la somme à 1
    a, b, alpha = a / norm, b / norm, alpha / norm
    keep = alpha >= ALPHA_NOISE
    solid = alpha >= ALPHA_SOLID
    scale = np.where(solid, 1 / np.maximum(alpha, 1e-9), 1)
    a, b = a * scale * keep, b * scale * keep
    alpha = np.where(keep, np.where(solid, 1, alpha), 0)
    premult = a[..., None] * np.array(NAVY, float) + b[..., None] * np.array(ORANGE, float)
    return np.dstack([premult, alpha])


def bbox(alpha: np.ndarray, threshold: float = BBOX_ALPHA):
    ys, xs = np.nonzero(alpha > threshold)
    # Bords des pixels (le pixel i couvre [i, i + 1]).
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def render_logo(matte: np.ndarray, box, size: int, logo_width: float) -> np.ndarray:
    """Logo centré sur la toile size×size, largeur de sa boîte = logo_width px."""
    x0, y0, x1, y1 = box
    k = logo_width / (x1 - x0)  # px de sortie par px source
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = size / (2 * k)
    src_box = (cx - half, cy - half, cx + half, cy + half)
    channels = []
    for i in range(4):
        band = Image.fromarray(matte[..., i].astype(np.float32), mode='F')
        channels.append(
            np.asarray(band.resize((size, size), Image.Resampling.LANCZOS, box=src_box))
        )
    out = np.dstack(channels).astype(float)
    out[..., 3] = np.clip(out[..., 3], 0, 1)
    out[..., :3] = np.clip(out[..., :3], 0, 255 * out[..., 3:4])
    return out


def rounded_plate(size: int, radius_ratio: float) -> np.ndarray:
    """Masque (0–1) d'un carré blanc aux coins arrondis, anticrénelé."""
    big = size * SUPERSAMPLE
    mask = Image.new('L', (big, big), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, big - 1, big - 1), radius=round(radius_ratio * big), fill=255
    )
    return np.asarray(mask.resize((size, size), Image.Resampling.BOX)).astype(float) / 255


def on_white(logo: np.ndarray, plate: np.ndarray | None = None) -> Image.Image:
    """Logo (prémultiplié) posé sur du blanc ; plate = coins transparents."""
    rgb = logo[..., :3] + (1 - logo[..., 3:4]) * WHITE
    if plate is None:
        return Image.fromarray(np.round(rgb).astype(np.uint8), 'RGB')
    rgba = np.dstack([rgb, plate * 255])
    return Image.fromarray(np.round(rgba).astype(np.uint8), 'RGBA')


def max_radius(alpha: np.ndarray, box) -> float:
    """Distance max (px source) entre un pixel du logo et le centre de sa boîte."""
    x0, y0, x1, y1 = box
    ys, xs = np.nonzero(alpha > 0)
    return float(np.hypot(xs + 0.5 - (x0 + x1) / 2, ys + 0.5 - (y0 + y1) / 2).max())


def save_detoured(matte: np.ndarray, path: Path, margin: int = 4) -> None:
    """Logo sur fond transparent, recadré sur sa boîte englobante (+ marge)."""
    x0, y0, x1, y1 = bbox(matte[..., 3])
    crop = np.pad(matte, ((margin, margin), (margin, margin), (0, 0)))[
        y0 : y1 + 2 * margin, x0 : x1 + 2 * margin
    ]
    alpha = crop[..., 3:4]
    color = np.where(alpha > 0, crop[..., :3] / np.maximum(alpha, 1e-9), 0)
    out = np.dstack([color, alpha * 255])
    Image.fromarray(np.round(out).astype(np.uint8), 'RGBA').save(path, optimize=True)
    print(f'{path.relative_to(ROOT)} : {x1 - x0 + 2 * margin}×{y1 - y0 + 2 * margin}, fond transparent')


def main() -> None:
    rgb = np.asarray(Image.open(SOURCE).convert('RGB')).astype(float)
    matte = unmix(rgb)
    # Marge transparente : le recadrage centré peut dépasser la toile source.
    pad = max(matte.shape[:2])
    matte = np.pad(matte, ((pad, pad), (pad, pad), (0, 0)))
    box = bbox(matte[..., 3])
    bw, bh = box[2] - box[0], box[3] - box[1]
    r_max = max_radius(matte[..., 3], box)
    print(f'boîte englobante du logo : {bw}×{bh} px (ratio {bw / bh:.3f})')

    # Logos détourés à la résolution source (supports, docs, site vitrine).
    save_detoured(matte, ROOT / 'public/brand/logo-mark.png')
    wordmark_rgb = np.asarray(Image.open(WORDMARK_SOURCE).convert('RGB')).astype(float)
    save_detoured(unmix(wordmark_rgb), ROOT / 'public/brand/logo-wordmark.png')

    # Maskable : tout pixel du logo dans un cercle de 34 % de rayon, avec de
    # la marge dans la zone sûre (cercle central de 80 % de diamètre, soit
    # 40 % de rayon) même sous le masque le plus serré.
    maskable_width = 0.34 * 512 / r_max * bw

    icons = [
        # (fichier, taille, largeur du logo en px, coins arrondis ou None)
        ('public/icons/icon-192.png', 192, 0.74 * 192, 0.2237),
        ('public/icons/icon-512.png', 512, 0.74 * 512, 0.2237),
        ('public/icons/icon-maskable-512.png', 512, maskable_width, None),
        ('public/apple-touch-icon.png', 180, 0.74 * 180, None),
    ]
    (ROOT / 'public/icons').mkdir(exist_ok=True)
    for path, size, width, radius in icons:
        logo = render_logo(matte, box, size, width)
        plate = rounded_plate(size, radius) if radius else None
        on_white(logo, plate).save(ROOT / path, optimize=True)
        print(f'{path} : {size}×{size}, logo {width / size:.1%} de large')

    # Favicon : 16, 32 et 48 px, chacun rendu à sa taille (pas de réduction
    # automatique), logo un peu plus grand pour rester lisible.
    favicons = [
        on_white(render_logo(matte, box, s, 0.86 * s), rounded_plate(s, 0.2)) for s in (16, 32, 48)
    ]
    favicons[-1].save(
        ROOT / 'app/favicon.ico',
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=favicons[:-1],
    )
    print('app/favicon.ico : 16, 32, 48 px')

    # Logotype de l'en-tête : même dessin, orange du logo.
    wordmark_path = ROOT / 'public/logo.png'
    wordmark = np.asarray(Image.open(wordmark_path).convert('RGBA')).copy()
    wordmark[..., :3] = ORANGE
    wordmark[wordmark[..., 3] == 0, :3] = 0
    Image.fromarray(wordmark, 'RGBA').save(wordmark_path, optimize=True)
    print('public/logo.png : recoloré en #%02X%02X%02X' % ORANGE)


if __name__ == '__main__':
    main()
