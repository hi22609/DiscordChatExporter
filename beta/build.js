#!/usr/bin/env node
// Inlines the BETA app into the share-page shell to produce wtm-share.html.
// The app source is embedded as a JSON string literal; `</` is escaped so the
// literal cannot terminate the surrounding <script> tag early.
const fs = require('fs');
const path = require('path');
const dir = __dirname;

const app = fs.readFileSync(path.join(dir, 'wtm-beta.html'), 'utf8');
const shell = fs.readFileSync(path.join(dir, 'wtm-share-shell.html'), 'utf8');

if (!shell.includes('__APP_SRC__')) {
  console.error('build failed: shell is missing the __APP_SRC__ placeholder');
  process.exit(1);
}

const literal = JSON.stringify(app).replace(/<\//g, '<\\/');
const out = shell.replace('__APP_SRC__', literal);
const target = path.join(dir, 'wtm-share.html');
fs.writeFileSync(target, out);

// Verify the embedded literal parses back to the exact source.
const m = out.match(/const APP_SRC=("(?:[^"\\]|\\.)*");/s);
if (!m || JSON.parse(m[1]) !== app) {
  console.error('build failed: embedded app source did not round-trip');
  process.exit(1);
}
console.log(`built ${path.relative(process.cwd(), target)} (${out.length} bytes, round-trip verified)`);
