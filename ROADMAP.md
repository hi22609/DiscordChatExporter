# CTO Audit & Roadmap — Bitcoin Cycle Tracker

*Brutally honest, ROI-ordered. Updated after the trust/perf/growth overhaul.*

---

## The honest audit

**What this product actually is:** a 430KB single-file PWA (~7,800 lines of HTML/CSS/JS)
served from GitHub Pages, with a genuinely differentiated cycle engine, strong visual
identity, and a trust-first positioning (open-source, no tracking, no account).

### What's genuinely good
- The **cycle engine** (bottom-anchored 1070/364 model) is a real product thesis, not a wrapper around someone else's chart.
- **Zero-backend architecture** is a moat, not a compromise: "read every line, runs in your browser" is the highest-trust pitch possible for this audience.
- Real live data where it counts: price (CoinGecko), Fear & Greed, mempool/blocks/fees (mempool.space), and now large transactions.
- The design language is distinctive and consistent (dark, orange, canvas-rendered 3D).

### What was broken (fixed in this overhaul)
| Severity | Problem | Status |
|---|---|---|
| 🔴 Trust | Whale feed **fabricated random transactions** every 5s under a LIVE badge | ✅ Replaced with real mempool.space transactions, real txids linked to the explorer; shows an honest error instead of fake data when offline |
| 🔴 Trust | Email capture promised "your first weekly brief arrives Sunday" — while writing the address into the user's own localStorage. Nothing was ever sent | ✅ Removed entirely (modal, inline form, timers). A newsletter returns only when a real backend sends it |
| 🔴 Trust | "Intelligence Feed" showed hardcoded headlines with **fake "2h ago" timestamps** | ✅ Reframed as "Milestones That Matter" — verifiable, dated facts |
| 🔴 Trust | Supply Shock panel: hardcoded numbers labeled "● LIVE DATA" | ✅ Relabeled "INDUSTRY ESTIMATES" |
| 🟠 Trust | FOMO copy ("Every week you wait is a week they don't") | ✅ Rewritten to honest confidence |
| 🔴 Reliability | Chart.js CDN was a **single point of failure** — if unreachable, the entire app crashed mid-init | ✅ No-op shim: charts degrade gracefully, everything else works |
| 🟠 Perf | Chart.js render-blocking in `<head>` — first paint waited on a CDN | ✅ Moved to end of body |
| 🟠 Product | "PWA" had no service worker — no offline, no instant repeat loads | ✅ `sw.js`: stale-while-revalidate shell, network-only market data, failure-tolerant install |
| 🟠 Growth | No deep links — 8 pages, one URL, no back button | ✅ Hash router (`#calc`, `#future`, …) + browser history |
| 🟡 SEO | No structured data, no canonical, no sitemap | ✅ JSON-LD WebApplication + canonical + sitemap.xml |

### What's still true (and needs owning)
- **The repo identity is the single biggest liability.** The definitive Bitcoin platform cannot live at `…github.io/DiscordChatExporter/bitcoin-app/`. Fatal for credibility, memorability, SEO, and link-sharing.
- **One 7,800-line file** is now past the point where it helps. It stays verifiable, but development speed and review quality degrade every week we grow it.
- **The cycle model shows no receipts.** It asserts "next bottom Oct 5, 2026" with no backtest overlay. Confidence without evidence reads as astrology to the sophisticated user we want.
- **Zero visibility**: no analytics (by design — the no-tracking promise is worth keeping), but also no error monitoring and no way to know if anyone visits. Server-side/edge analytics via a custom domain + Cloudflare solves this **without** client tracking.
- Institutional holders table, ETF flow figures, and supply estimates are static snapshots that will silently go stale. They need dates on them or a build-time refresh.

---

## Roadmap — ordered by ROI

### P0 — Identity (requires owner, ~15 minutes, highest ROI of anything on this list)
**STATUS: FULLY PREPARED.** This branch (`standalone`) IS the migration: app at repo
root, `migrate.sh` for the one-shot URL rewrite, CI test suite included.
Follow `MIGRATION.md` — it's copy-paste.
1. **New dedicated repo** with a real name (candidates: `thebitcoinclock`, `cyclesat`, `blocksignal`). History matters less than the URL.
2. **Custom domain** (~$10/yr) → GitHub Pages custom domain. Unlocks: real robots.txt, clean share links, Search Console, Cloudflare edge (free tier: caching, privacy-respecting analytics, security headers).
3. Update OG tags, canonical, README, share captions to the new URL (one grep-replace — prepared for).

### P1 — Prove the model (trust → retention)
4. **Backtest overlay**: draw the model's curve against actual BTC history (static historical price table, ~monthly closes, versioned in-repo). "Here's where the model was right and wrong" is the single most persuasive screen we could ship.
5. **Date-stamp every static dataset** (holders table, ETF figures, supply estimates) with "as of" labels and a build-time refresh script.
6. **Model page**: assumptions, math, and limitations in plain language. Preempt the astrology critique.

### P2 — Growth engine (SEO is the whole game for calculator products)
7. **Programmatic landing pages**: `dca-calculator.html`, `retirement.html`, `satoshi-converter.html`, `halving-countdown.html` — each a real, fast, standalone page targeting a high-volume search term, deep-linking into the app (hash routes now exist). This is how every successful calculator site wins organic traffic.
8. **Embeddable widgets** (iframe + one-line script): halving countdown, cycle signal badge. Every embed is a backlink.
9. **Lightning zaps** next to the on-chain donation (needs owner's LN address).
10. Content engine (built) → wire to a scheduler; weekly "cycle brief" as a shareable image.

### P3 — Architecture (pay down before the next big feature)
11. **Split the monolith**: `index.html` → modules (`cycle-engine.js`, `charts.js`, `pages/*.js`) with a minimal Vite build → still deploys as static files, stays readable, gains tree-shaking + minification. Keep a "view unminified source" link to preserve the verifiability pitch.
12. **Vendor Chart.js** (drop the CDN entirely) — removes the last third-party runtime dependency; enables SRI-free integrity by ownership.
13. **Test harness in-repo**: the Playwright click-through + overlap + syntax audits currently live in scratch — commit them as `tests/` with a GitHub Action on every push.

### P4 — Product depth (each is a real feature, gated on P0–P2)
14. Historical purchasing-power calculator ("$100/mo since 2017 → ?") — needs the P1 price table, huge share potential.
15. Rainbow chart / Pi Cycle / MVRV overlays on the big chart (MVRV needs a data source — evaluate free options honestly; never fake it).
16. Push notifications for signal changes (real ones, via the SW — no email needed, on-device, fits the privacy stance).
17. Per-user dashboard layout (localStorage), watchlist, and a printable/exportable "cycle report".

### Standing rules (enforced from today)
- **Nothing fake wears a LIVE badge.** Real data, labeled estimates, or an honest error — those are the only three states.
- **No feature that pretends.** If there's no backend, there's no "we'll email you."
- The no-tracking promise is permanent. Measurement happens at the edge (post-P0), never in the client.
