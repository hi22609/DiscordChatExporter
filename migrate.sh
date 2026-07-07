#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────
# One-shot URL migration for the Bitcoin Cycle Tracker.
#
# Rewrites every hardcoded URL (OG tags, canonical, JSON-LD, sitemap, share
# card, README, content engine) from the old DiscordChatExporter address to
# your new home. Run it ONCE after cloning this branch into your new repo.
#
#   ./migrate.sh https://hi22609.github.io/thebitcoinclock/
#   ./migrate.sh https://thebitcoinclock.com/ thebitcoinclock.com
#
# Arg 1 (required): the full new URL, WITH trailing slash
# Arg 2 (optional): custom domain — writes the CNAME file GitHub Pages needs
# ──────────────────────────────────────────────────────────────────────────
set -euo pipefail

NEW_URL="${1:-}"
CUSTOM_DOMAIN="${2:-}"

if [[ -z "$NEW_URL" ]]; then
  echo "Usage: ./migrate.sh <new-full-url-with-trailing-slash> [custom-domain]"
  echo "  e.g. ./migrate.sh https://hi22609.github.io/thebitcoinclock/"
  echo "  e.g. ./migrate.sh https://thebitcoinclock.com/ thebitcoinclock.com"
  exit 1
fi
[[ "$NEW_URL" == */ ]] || NEW_URL="$NEW_URL/"

OLD_URL="https://hi22609.github.io/DiscordChatExporter/bitcoin-app/"
OLD_DISPLAY="hi22609.github.io/DiscordChatExporter"
NEW_DISPLAY="$(echo "$NEW_URL" | sed -E 's#^https?://##; s#/$##')"

FILES=(index.html README.md sitemap.xml content-engine/generate.mjs content-engine/README.md)

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue
  sed -i.bak "s#${OLD_URL}#${NEW_URL}#g; s#${OLD_DISPLAY}#${NEW_DISPLAY}#g" "$f"
  rm -f "$f.bak"
  echo "  ✓ rewrote $f"
done

if [[ -n "$CUSTOM_DOMAIN" ]]; then
  echo "$CUSTOM_DOMAIN" > CNAME
  echo "  ✓ wrote CNAME ($CUSTOM_DOMAIN)"
fi

echo
echo "Done. Review with:  git diff"
echo "Then:               git add -A && git commit -m 'Migrate URLs to $NEW_DISPLAY' && git push"
