#!/usr/bin/env node
// Inlines the BETA app into the share-page shell to produce wtm-share.html.
// The app source is embedded as a JSON string literal; `</` is escaped so the
// literal cannot terminate the surrounding <script> tag early.
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const faces = fs.readFileSync(path.join(dir, 'fonts', 'faces.css'), 'utf8');

// Fonts are injected at build time rather than pasted into the sources: the
// four subset faces are ~45 KB of base64 and would make the sources unreadable.
// The Artifact CSP blocks font CDNs, so they must be inlined as data URIs.
const inject = (html) => html.replace('__FONTS__', () => faces);

const app = inject(fs.readFileSync(path.join(dir, 'wtm-beta.html'), 'utf8'));
const shell = inject(fs.readFileSync(path.join(dir, 'wtm-share-shell.html'), 'utf8'));

if (!shell.includes('__APP_SRC__')) {
  console.error('build failed: shell is missing the __APP_SRC__ placeholder');
  process.exit(1);
}

const literal = JSON.stringify(app).replace(/<\//g, '<\\/');
const out = shell.replace('__APP_SRC__', literal);
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });

// Standalone app, fonts inlined — open directly in a browser.
fs.writeFileSync(path.join(dir, 'dist', 'wtm-app.html'), app);

const target = path.join(dir, 'dist', 'wtm-share.html');
fs.writeFileSync(target, out);

// Verify the embedded literal parses back to the exact source.
const m = out.match(/const APP_SRC=("(?:[^"\\]|\\.)*");/s);
if (!m || JSON.parse(m[1]) !== app) {
  console.error('build failed: embedded app source did not round-trip');
  process.exit(1);
}
console.log(`built ${path.relative(process.cwd(), target)} (${out.length} bytes, round-trip verified)`);
