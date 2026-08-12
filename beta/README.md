# WTM BETA

The demo build. Two source files, one generated file.

| File | What it is |
|---|---|
| `wtm-beta.html` | The app itself. Standalone — open it directly in a browser. |
| `wtm-share-shell.html` | The share/landing page wrapper. Contains an `__APP_SRC__` placeholder. |
| `wtm-share.html` | **Generated.** Do not edit by hand; it is overwritten by the build. |

## Build

```bash
node beta/build.js
```

Inlines `wtm-beta.html` into the shell and verifies the embedded copy round-trips
byte-for-byte. Exits non-zero on failure.

## Test

```bash
npm --prefix beta install     # once: installs playwright-core
node beta/tools/test-flow.js    # end-to-end interaction regression
node beta/tools/diag-layout.js  # asserts map chrome is positioned correctly
node beta/tools/shots.js        # writes screenshots
```
