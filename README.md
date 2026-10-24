# chizpita.com

Static site for [Chizpita](https://chizpita.com) — handmade cheese pockets, San Diego.

Served by GitHub Pages from `main` (root). No build step: plain HTML/CSS/vanilla JS.

- `index.html` — bilingual, invitation-only landing page (Spanish first; `?lang=en` or the ES/EN toggle for English)
- `assets/` — favicon, OG image, web manifest, `brand/` logo + mascot files
- `CNAME` — custom domain (`chizpita.com`)

## Flavors

Edit the `<script type="application/json" id="flavor-data">` block near the end of `index.html`.
Order = display order; `"new": true` adds the NUEVO/NEW sticker; `color` tints the sauce dab. The plain flavor is "El Clásico" in both languages.

## Brand assets

From [chizpita/brand](https://github.com/chizpita/brand) v3.0.0 (main @ba810d9, not yet tagged), picked per its `brand.json` use cases. The WebP files are size conversions of the brand's own PNG exports (no edits to the artwork); re-export on a brand version bump.

| Use | File here | Source in chizpita/brand |
|---|---|---|
| Header logo (+ narrow < 360px) | `assets/brand/chizpita-horizontal-color.webp`, `chizpita-icon-color.webp` | `exports/logo/horizontal/…-512@2x.png`, `exports/logo/icon/…-128@2x.png` |
| Hero art | `assets/brand/chizpita-mark-color(-600).webp` | `exports/logo/mark/chizpita-mark-color-512@2x.png` |
| Mascot | `assets/brand/chizpita-mascot-waving(-480).webp` | `exports/mascot/chizpita-mascot-waving-512@2x.png` |
| Favicons, PWA icons, manifest | `assets/favicon.ico`, `assets/favicon-32.png`, `assets/icon-*.png`, `assets/apple-touch-icon.png`, `assets/site.webmanifest` | `exports/web/` |
| Link preview | `assets/og.png` | `exports/social/og-image-1200x630.png` |

The mascot is named Chizpita (never "Chizpi"). Lockups with the wordmark already carry ™; in copy write Chizpita™ on the first or most prominent mention. Never ®.

## Rules

Landing page only: Chizpita is by invitation only for now. No ordering, prices, schedules, delivery areas, contact details or team names on the site. Taglines are English-only ("Love at first bite", "Handmade in San Diego", "Handmade with love"). No client data or secrets belong in this repository.
