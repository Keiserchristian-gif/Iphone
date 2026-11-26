'use strict';
/* Baut aus der App eine einzelne Datei für die Claude-Vorschau: node tools/build-artifact.js [Zieldatei] */
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const index = read('index.html');
const body = index.split('<!-- APP:START -->')[1].split('<!-- APP:END -->')[0].trim();
const out = [
  '<title>Gedankenkarte</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  '<style>\n' + read('src/styles.css') + '</style>',
  body,
  '<script>\n' + read('src/core.js') + '</script>',
  '<script>\n' + read('src/pdf.js') + '</script>',
  '<script>\n' + read('src/app.js') + '</script>',
  ''
].join('\n');
if (/<\/script>/i.test(read('src/core.js') + read('src/pdf.js') + read('src/app.js'))) throw new Error('Skript enthält ein schließendes script-Tag');
const target = process.argv[2] || path.join(root, 'dist', 'gedankenkarte.html');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
/* Zum Testen: dieselbe Datei in der Hülle, die Claude beim Veröffentlichen darum legt. */
const shell = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>' +
  ':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
fs.writeFileSync(path.join(path.dirname(target), 'preview.html'), shell + out + '</body></html>');
console.log(target + ' (' + Math.round(out.length / 1024) + ' KB)');
