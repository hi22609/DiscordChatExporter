# WTM Deployment Runbook

Follow top to bottom. Each phase ends with a checkpoint you can verify.
Total cost to launch: **$124 up front** ($99/yr Apple + $25 Google) +
**~$0–35/mo** infra.

---

## Phase 0 — Accounts (start TODAY, longest lead times)

- [ ] **Apple Developer Program** — developer.apple.com/programs, $99/yr.
      Approval: 1–2 days. Nothing ships to iPhones without it.
- [ ] **Google Play Console** — play.google.com/console, $25 once.
- [ ] **Supabase account** — supabase.com (free tier is fine for beta).
- [ ] **Google Cloud** — console.cloud.google.com for a Maps API key.
- [ ] **Expo account** — expo.dev (free) for EAS builds.
- [ ] **Domain** — buy `whatsthemove.app` (or your pick) — needed for deep
      links, legal pages, and invite links.

## Phase 1 — Backend live (~1 hour)

```bash
npm install -g supabase
supabase login
supabase projects create wtm --region us-east-1
supabase link --project-ref <PROJECT_REF>

# Run all 10 migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy validate-invite
supabase functions deploy send-push-notification
supabase functions deploy generate-invite-codes
supabase secrets set ADMIN_SECRET=<long-random-string>
```

In the Supabase dashboard:
- [ ] Storage → create buckets `avatars`, `move-images`, `spot-images` (public)
- [ ] Auth → disable email confirmations for beta (or configure SMTP)
- [ ] Database → verify PostGIS is enabled (migration 001 does this)

Generate founder codes:
```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/generate-invite-codes \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"count": 100, "maxUses": 1}'
```

**Checkpoint:** dashboard shows all tables; codes returned.

## Phase 2 — App running locally (~30 min)

```bash
cd wtm
npm install
cp .env.example .env   # fill in SUPABASE_URL, ANON_KEY, GOOGLE_MAPS_API_KEY
npx expo start
```

- [ ] Sign up with a founder code on your own phone (Expo Go)
- [ ] Post a move, see it on the map, RSVP from a second account

**Checkpoint:** the full loop works against your own backend.

## Phase 3 — TestFlight + Android internal (~week 1–2)

```bash
npm install -g eas-cli
eas login
eas init                       # writes real projectId into app.json
eas credentials                # let EAS manage certs — accept defaults
eas build --profile preview --platform all
eas submit --platform ios      # → TestFlight (review ~24–48h)
```

- [ ] Replace `YOUR_EAS_PROJECT_ID` in app.json (eas init does this)
- [ ] Set `GOOGLE_MAPS_API_KEY` as an EAS secret: `eas secret:create`
- [ ] Invite testers by email in App Store Connect → TestFlight
- [ ] Android: upload the .aab to Play Console → Internal testing

**Checkpoint:** friends without dev tools are using the real app.

## Phase 4 — Website + deep links (~half a day)

Host on the domain (Vercel/Netlify free tier):
- [ ] `/privacy` → docs/legal/privacy-policy.md (fill [DATE], render as HTML)
- [ ] `/terms` → docs/legal/terms-of-service.md
- [ ] `/.well-known/apple-app-site-association` (template in README, add your TEAM_ID)
- [ ] `/.well-known/assetlinks.json` (template in README, add SHA256 from
      `eas credentials` → Android keystore)
- [ ] `/i/CODE` → landing page with app-store badges + the code (until the
      apps are live, show "get the beta" links)

**Checkpoint:** tapping an invite link on a phone with the app opens the app.

## Phase 5 — App Store submission (~week 4–5)

App Store Connect checklist:
- [ ] Screenshots (6.7" + 6.1"): map, spots layer, move detail, invite screen
- [ ] Privacy "nutrition label": location (app functionality), user content,
      identifiers (push token) — matches privacy-policy.md
- [ ] Age rating: 17+
- [ ] Privacy policy URL + support URL (the domain from Phase 4)
- [ ] Review notes: **include a working invite code for the review team**
      and a test account — reviewers must be able to get past the gate
- [ ] Demo video link if reviewers can't trigger location-based content

Expect one rejection on first submission (everyone gets one — usually
metadata or the UGC checklist). The app has the required pieces: report
content ✓, block users ✓ (migration 010), moderation contact in terms ✓.

## Phase 6 — Launch ops

- [ ] Upgrade Supabase to Pro ($25/mo) when daily actives pass ~200
- [ ] Add Sentry (`npx @sentry/wizard`) — log.ts is the hook point
- [ ] Watch reports table daily (24h response promised in ToS)
- [ ] Rotate founder codes per neighborhood/scene, watch the referral graph

## Cost summary

| Item | Cost |
|---|---|
| Apple Developer | $99/yr |
| Google Play | $25 once |
| Supabase | $0 beta → $25/mo |
| Google Maps | $0 (under $200/mo credit) |
| Domain | ~$15/yr |
| Vercel/Netlify | $0 |
| **Monthly at launch** | **~$0–35** |
