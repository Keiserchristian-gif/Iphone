'use strict';
/* Zeichnet das App-Symbol in drei Größen: node tools/make-icons.js */
const path = require('node:path');
const { chromium } = require('playwright');

const html = (size) => `<body style="margin:0"><div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,#2F6FE8,#7A45E6 62%,#E8730F)">
<svg viewBox="0 0 24 24" width="${size * 0.5}" height="${size * 0.5}" style="fill:none;stroke:#fff;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round"><rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path></svg></div></body>`;

(async () => {
  const browser = await chromium.launch();
  for (const size of [180, 192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(html(size));
    await page.screenshot({ path: path.join(__dirname, '..', 'icons', 'icon-' + size + '.png') });
    await page.close();
  }
  await browser.close();
})();
