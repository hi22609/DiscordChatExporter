# 05 — CONSTRUCTION

## What actually happened, stated plainly

**Wave 5 was cut.** The brief says to cut feature scope first when behind, and I was behind.
The reason is in the log: Wave 0 uncovered that BETA was not in version control and that
RAW's migrations could not apply, which turned Waves 2 and 4 into much larger jobs than
budgeted. Remediation and the visual identity consumed the construction budget.

Two things were built that are not strictly "features" but were the highest-value things
available, and both are finished rather than stubbed:

| Built | Why it counts |
|---|---|
| **`beta/build.js` + the `dist/` pipeline** | BETA had no build. Sources now stay readable, fonts are injected at build time, and the embedded copy is verified byte-for-byte with a non-zero exit on failure. |
| **`beta/tools/` verification suite** | 4 scripts: end-to-end interaction regression, layout assertion, font-loading verification, screenshot capture across 3 viewports × 2 themes. This is what caught the render-loop and `calc()` bugs. |

Both were used repeatedly tonight, which is the test of whether tooling is real.

## Scored candidates — what I would build next, in order

Scored before writing code, as the brief asks. Cost is a gate, not a weight: anything above
zero is disqualified outright.

| Feature | Demo | Utility | Cost | Fit | Effort | Revers. | Total | Verdict |
|---|---|---|---|---|---|---|---|---|
| **"Just Us" + "The Scene" in RAW's category enum** | 5 | 5 | 0 ✓ | 5 | 5 | 5 | **25** | **Build first.** The two categories the whole demo is built around do not exist in RAW. One migration + one constant. |
| **Error/retry states for the 8 broken screens** | 3 | 5 | 0 ✓ | 5 | 4 | 5 | **22** | **Build second.** The app currently says "nothing exists" whenever the network is bad. |
| **Collapse the `nearby_moves` overloads** | 5 | 4 | 0 ✓ | 4 | 4 | 4 | **21** | Revives trending, crew-going and waitlist — three built features that are invisible today. |
| **Apply BETA's tokens to RAW** | 4 | 3 | 0 ✓ | 4 | 3 | 5 | **19** | 18 screens hand-roll `#FF6B35`. Now that NativeWind is wired, the existing token palette can finally do its job. |
| **Reveal-address-on-join** | 4 | 4 | 0 ✓ | 4 | 4 | 5 | **21** | Already in BETA. Good safety property for a 17–25 product. |
| **Geocode the create-move address** | 2 | 5 | 0 ✓ | 4 | 3 | 4 | **18** | Every move created today lands downtown. `Location.geocodeAsync` is already a dependency. |
| **Push token registration** | 3 | 5 | 0 ✓ | 3 | 3 | 4 | **18** | Would make the whole notification stack stop being dead code. **Do C2 first** — registering tokens into a world-readable table is worse than having none. |
| Reverse-geocode the city label | 1 | 3 | 0 ✓ | 5 | 5 | 5 | 19 | Trivial, but low impact. Good warm-up. |

## Considered and rejected

| Rejected | Why |
|---|---|
| **A real feedback backend for BETA** | Every zero-cost option (Formspree, Google Forms, Supabase table) is a third-party account only Michael can create, and the artifact CSP blocks outbound network anyway. Written up as a decision instead of guessed at. |
| **Porting BETA's canvas map into RAW** | RAW correctly uses `react-native-maps`. The canvas map is a demo artifact. Porting it would be a downgrade dressed as a feature. |
| **A design-system component library for RAW** | Tempting, and exactly the kind of thing that ends the night 60% done across 18 screens. `Button.tsx` already exists, is imported by nothing, and cannot work — that is the warning. |
| **Anything with an LLM, image processing or a paid API** | Rule 1. |
| **Fixing the `moves_with_counts` → `nearby_moves` chain end-to-end** | Needs a live database to verify. Unverifiable SQL surgery at 4am is how you get a broken schema and a cheerful summary. |
| **Rewriting the 18 screens' inline styles** | Large, mechanical, and would have consumed the whole night for no visible gain in the demo — which is the thing being shown to people. |

The consistent principle: **ship three finished things rather than seven half-built ones**,
and do not do surgery I cannot verify.
