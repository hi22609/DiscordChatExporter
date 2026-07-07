# Moving to a real home — the 15-minute migration

This branch **is** the standalone site: the app lives at the repo root, ready to
be pushed to a fresh repository with a real name. Everything below is
copy-paste.

## Why this matters

The definitive Bitcoin platform cannot live at
`…github.io/DiscordChatExporter/bitcoin-app/`. The name kills credibility on
sight, poisons every shared link, and caps SEO at zero. This is the
highest-ROI half hour available to the project.

---

## Step 1 — Create the new repo (2 min)

On GitHub: **New repository** → name it (suggestions: `thebitcoinclock`,
`cyclesat`, `blocksignal`) → **Public** → do NOT initialize with a README.

> Renaming later is cheap — nothing links to the new URL yet. Don't stall on
> the name.

## Step 2 — Clone this branch & point it at the new repo (3 min)

```bash
git clone --branch standalone --single-branch \
  https://github.com/hi22609/DiscordChatExporter.git thebitcoinclock
cd thebitcoinclock
git remote set-url origin https://github.com/hi22609/NEW_REPO_NAME.git
```

## Step 3 — Rewrite the URLs (1 min)

```bash
./migrate.sh https://hi22609.github.io/NEW_REPO_NAME/
# or, if you bought a domain:
./migrate.sh https://yourdomain.com/ yourdomain.com
```

This rewrites the OG tags, canonical, JSON-LD, sitemap, share-card footer,
README, and content engine in one shot (and writes `CNAME` if you passed a
domain).

## Step 4 — Push & enable Pages (3 min)

```bash
git add -A && git commit -m "Migrate to new home"
git push -u origin standalone:main
```

Then on GitHub: **Settings → Pages → Source: Deploy from branch → `main` /
`(root)`** → Save. Site is live at the new URL in ~1 minute.

## Step 5 — Custom domain (optional, +10 min)

1. Buy the domain (~$10/yr — Namecheap, Porkbun, Cloudflare Registrar).
2. DNS: `CNAME` record → `hi22609.github.io` (or 4 `A` records to GitHub
   Pages IPs for an apex domain — GitHub docs: "Managing a custom domain").
3. GitHub **Settings → Pages → Custom domain** → enter it → wait for the DNS
   check → tick **Enforce HTTPS**.
4. Bonus (recommended): put the domain on Cloudflare's free tier →
   privacy-respecting edge analytics with **zero client-side tracking**, plus
   caching and security headers. This keeps the "no tracking" promise intact
   while finally giving you visibility.

## Step 6 — Verify (2 min)

- Open the new URL: app loads, nav works, deep links work (`/#calc`).
- Paste the URL into an X/Discord composer: the social card should render.
- Lighthouse it if you're curious — the service worker + non-blocking Chart.js
  should score well.

## Afterwards

- Submit `sitemap.xml` in Google Search Console (now possible — you own the
  identity).
- Update any links you've posted.
- The old gh-pages deployment keeps working during the transition; retire it
  whenever you're ready.

*CI: this branch ships `tests/verify.mjs` + a GitHub Actions workflow that runs
the full click-through suite on every push. It runs automatically once pushed.*
