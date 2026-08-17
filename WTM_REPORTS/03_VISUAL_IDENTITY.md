# 03 — VISUAL IDENTITY

## 3.1 Tell audit — what was present

I ran the brief's tell list against `beta/` before touching anything. Counts are from `grep`.

| Tell from the brief | Present? | Evidence |
|---|---|---|
| Indigo/violet/purple gradients | **YES — worst offender** | `--violet:#7C3AED`, `--violet2:#A78BFA`, `--violet3:#5B21B6`; 19 occurrences of `linear-gradient(135deg,var(--violet),var(--blaze))` |
| Gradient text on the hero | **YES** | 6× `-webkit-background-clip:text` — wordmark, nav logo, hero H1, fullscreen bar title, footer |
| Radial gradient blobs behind hero | **YES** | `.glow1/.glow2/.glow3`, `filter:blur(120px)`, plus 2 canvas radial gradients on the welcome screen |
| Glassmorphism | **YES** | 11× `backdrop-filter:blur(...)` over `rgba()` with `border:0.5px solid rgba(238,234,250,.16)` |
| Safe default face at every weight | **YES** | Entire product was `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`. No display face. Nearly everything 700–900. |
| Uniform radii everywhere | **YES** | **19 distinct `border-radius` values** (2,4,6,8,9,11,12,13,14,15,16,18,20,24,28,32,41,50,52px) across 100 declarations |
| `hover:scale/translate` on everything | **YES** | `.feat:hover{transform:translateY(-4px)}`, `.btn-main:hover{transform:translateY(-2px)}` |
| Emoji as iconography | **YES — badly** | Tab bar was 🔥🗺👥👤; every landing feature card led with an emoji; section markers 💡📧💬 |
| Identical section rhythm | **YES** | 4 consecutive `eyebrow → h2 → sub → grid` blocks at identical `padding:86px 0` |
| Everything centered | **YES** | Every section `text-align:center`, `max-width:1080px;margin:0 auto` |
| Uniform 3-col card grid | **YES** | `repeat(auto-fit,minmax(280px,1fr))`, identical cards, identical hover |
| Invented statistics | **YES** | "137 people locked in", "8 moves live", "4 friends out tonight", "3 rivers, 1 city" presented as live metrics |
| Untouched default neutrals | Partial | Greys were violet-tinted already, but ad-hoc |
| Numbered markers on non-sequences | No | The 1/2/3 "how it works" *is* a real sequence — kept |
| Cream/serif/terracotta | No | — |
| Acid-green pop on near-black | No | — |
| Sparkles icon | No | — |

**Diagnosis: four competing accent hues.** `--violet`, `--blaze`, `--scene` (magenta), `--justu` (amber), plus `--cyan`, `--green`, `--red`. Nothing could be emphatic because everything was. The brief's "spend boldness in exactly one place" was being violated seven ways.

## 3.2 The plan

### Where the accent comes from
Not a swatch. Pittsburgh after dark is lit by **high-pressure sodium street lamps** — the specific warm amber that makes a city block look like a film still. WTM is an app you open at night, outdoors, deciding where to go. So the accent is that lamp:

`--signal: #FF9E3D`

It means one thing and one thing only in this product: **live / happening / act now.** Nothing decorative uses it.

### Neutrals, deliberately biased
Wet asphalt under sodium light casts cool blue — the complement. So the greys are pulled toward blue, never neutral grey (the tell):

| Token | Hex | Role |
|---|---|---|
| `--ink-900` | `#0B0E14` | page ground |
| `--ink-800` | `#12161F` | raised surface |
| `--ink-700` | `#1A1F2B` | control surface |
| `--ink-600` | `#262C3A` | hairlines, borders |
| `--paper-100` | `#E8EAF0` | primary text |
| `--paper-400` | `#8A93A6` | secondary text |
| `--paper-600` | `#555E70` | tertiary / disabled |

Every one carries a blue bias (B > R at equal lightness). None is `#808080`, `slate`, or `gray`.

### Semantic axis — separate from the accent
`--ok #3FB37F` · `--warn #E0A44A` · `--stop #E5544B`. Used for state only. `--warn` is deliberately duller and yellower than `--signal` so the accent still wins.

### Category colour: removed
Previously four saturated hues fought the accent. Categories are now distinguished by **icon and label**, not hue. This is the single biggest change and the reason the product suddenly reads as designed.

### Type

| Role | Face | Why |
|---|---|---|
| Display | **Big Shoulders Bold** | Condensed industrial grotesque — civic signage, steel-city. Used *only* for the wordmark, screen titles, and large numerals. |
| Body | **Instrument Sans** 400/700 | Workhorse grotesque with more character than Inter, holds up at 13–17px. |
| Data | **Red Hat Mono** 400 | Counts, times, distances, uppercase micro-labels. `tabular-nums` so digits align. |

Real weight contrast: body 400 against display 700, instead of the previous everything-at-800.

**Self-hosted properly.** The Artifact CSP blocks font CDNs, so all four are subset to the Latin range actually used, converted to woff2, and inlined as data URIs — **45 KB total for four faces**, verified rendering (no silent fallback; see Verification).

Scale: 11 · 13 · 15 · 17 · 21 · 27 · 34 · 44 (≈1.25 ratio). Nothing off-scale.

### Form
- **Two radii.** `--r-sm: 6px` (chips, inputs, small controls) and `--r-md: 14px` (cards, sheets, buttons). Circles for avatars only — that is a shape, not a third radius. Down from 19 values.
- **Hairlines over shadows.** `1px solid var(--ink-600)` separates surfaces. Shadow appears only on things that genuinely float: the bottom sheet, map pins, the push banner. Elevation now means something.
- **Denser.** Section padding 86px → 56px. The AI look is partly just too much air.
- **Asymmetry on purpose.** The hero is left-aligned, not centered, and the eyebrow sits in a left rail. The feature grid is deliberately uneven (first card spans two columns) so it reads as authored rather than `auto-fit`.

### Motion
140ms `ease-out` on press feedback and the sheet only. Removed hover-lift from cards and buttons. `prefers-reduced-motion` honoured everywhere.

### Signature — one element
**The sodium rule.** A 1px hairline divider carrying a soft amber bloom at a single point, like a streetlight seen down a long block. It separates sections on the landing page and sits under the app header. It is the only decorative use of the accent, it is drawn from the concept rather than applied to it, and no template generates it.

### Copy
Every invented statistic **deleted, not rewritten** (per the brief). The stats strip is gone entirely; the hero no longer claims live numbers a demo cannot have.

## 3.3 Contrast verification (WCAG AA)

Measured with the WCAG 2.1 relative-luminance formula, not estimated. Full output in
`07_VERIFICATION.md`; summary:

| Pair | Ratio | AA normal (4.5) | AA large (3.0) |
|---|---|---|---|
| `--paper-100` on `--ink-900` | **15.79** | PASS | PASS |
| `--paper-100` on `--ink-800` | **14.05** | PASS | PASS |
| `--paper-400` on `--ink-900` | **6.94** | PASS | PASS |
| `--paper-400` on `--ink-800` | **6.17** | PASS | PASS |
| `--paper-600` on `--ink-900` | **3.20** | fail | PASS — restricted to large/decorative only |
| `--signal` on `--ink-900` | **9.13** | PASS | PASS |
| `--signal` on `--ink-800` | **8.12** | PASS | PASS |
| `--ink-900` on `--signal` (button) | **9.13** | PASS | PASS |
| `--ok` on `--ink-900` | **7.30** | PASS | PASS |
| `--stop` on `--ink-900` | **5.06** | PASS | PASS |
| Light theme: `--paper-100`→`#141821` on `#F2F3F7` | **13.90** | PASS | PASS |

`--paper-600` is the one pair that fails AA for normal text at 3.20. It is therefore used
only for large text and non-informational decoration. Flagged rather than hidden.

## 3.4 Systematised

All values live as CSS custom properties on `:root`. Both themes are defined **at token level**:
`:root` (light-independent defaults) → `@media (prefers-color-scheme: dark)` → and again under
`:root[data-theme="dark"]` / `:root[data-theme="light"]` so the viewer's explicit toggle wins in
both directions. Components reference tokens only; no component rule contains a literal colour.

BETA received the full treatment. RAW received the token system in `tailwind.config.js` +
`global.css` so it inherits the same identity, without spending the night on RAW's chrome at
the expense of its function.
