'use strict';
/* Oberflächen-Tests im iPhone-Format: node tests/e2e/run.js [Filter] */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { startServer } = require('../../tools/serve.js');

const PORT = 4311;
const BASE = process.env.GEDANKEN_URL || 'http://127.0.0.1:' + PORT + '/';
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

async function open(browser, opts) {
  opts = opts || {};
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, reducedMotion: opts.motion ? 'no-preference' : 'reduce',
    acceptDownloads: true, locale: 'de-DE', colorScheme: opts.dark ? 'dark' : 'light'
  });
  /* Wie ein Browser ohne Teilen-Menü und ohne Spracherkennung, damit die Tests überall gleich laufen. */
  await context.addInitScript((keepSpeech) => {
    try { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch (e) { /* egal */ }
    if (keepSpeech) return;
    try { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; } catch (e) { /* egal */ }
  }, !!opts.claude);
  if (opts.claude) {
    /* Die Claude-Vorschau: KI-Auswertung und Datei-Sichern kommen von außen, das Mikrofon ist gesperrt. */
    await context.addInitScript(() => {
      window.__asked = [];
      window.__saved = [];
      window.webkitSpeechRecognition = function () { window.__speechUsed = true; };
      const sample = () => Promise.reject({ code: 'invalid_request' });
      sample.json = (input) => {
        window.__asked.push(input);
        return Promise.resolve([{ title: 'Oma besuchen', cat: 'p', important: true, due: null }]);
      };
      const downloads = { save: (req) => { window.__saved.push({ filename: req.filename, size: req.data.size }); return Promise.resolve({ status: 'saved' }); } };
      window.claude = { use: (name) => Promise.resolve(name === 'sample' ? sample : (name === 'downloads' ? downloads : null)) };
    });
  }
  if (opts.seed) {
    await context.addInitScript((seed) => {
      if (!localStorage.getItem('gedanken.v1')) localStorage.setItem('gedanken.v1', seed);
    }, JSON.stringify(opts.seed));
  }
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE);
  return { context, page, errors };
}
async function start(page) {
  await page.click('#introGo');
  await page.waitForFunction(() => document.querySelectorAll('.nd.on').length === 3, null, { timeout: 8000 });
}
const node = (page, title) => page.locator('.nd.on', { hasText: title });
async function addThought(page, text, title) {
  await page.click('#btnType');
  await page.fill('#thought', text);
  await page.click('#compAdd');
  await node(page, title).waitFor({ state: 'visible', timeout: 12000 });
}
async function settle(page, ms) { await page.waitForTimeout(ms || 2600); }

test('Start zeigt die Begrüßung, danach drei Beispiele', async (browser) => {
  const { page, errors } = await open(browser);
  assert.ok(await page.locator('#intro').isVisible());
  const under = await page.evaluate(() => {
    const r = document.getElementById('introGo').getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && !!hit.closest('#intro');
  });
  assert.ok(under, 'die Begrüßung liegt sofort oben und nimmt Tipper an');
  await start(page);
  await page.waitForFunction(() => getComputedStyle(document.getElementById('intro')).opacity === '0');
  for (const t of ['Mama anrufen', 'Angebot raus', 'Podcast starten']) assert.equal(await node(page, t).count(), 1, t);
  assert.match(await page.locator('#coreCount').innerText(), /3 offen/);
  assert.deepEqual(errors, []);
});

test('Ein getippter Gedanke landet mit seinem Kern in der Karte und bleibt nach dem Neuladen', async (browser) => {
  const { page, errors } = await open(browser);
  await start(page);
  await addThought(page, 'Ich muss morgen unbedingt Oma anrufen', 'Oma anrufen');
  assert.match(await page.locator('#coreCount').innerText(), /4 offen/);
  await settle(page);
  await page.reload();
  await node(page, 'Oma anrufen').waitFor({ state: 'visible', timeout: 8000 });
  assert.equal(await page.locator('#intro.out').count(), 1, 'Begrüßung kommt nicht noch einmal');
  assert.deepEqual(errors, []);
});

test('Ohne Spracherkennung öffnet das Mikrofon die Eingabe zum Diktieren', async (browser) => {
  const { page } = await open(browser);
  await start(page);
  await page.click('#mic');
  await page.waitForSelector('#comp.open');
  assert.ok(await page.locator('#thought').isVisible());
});

test('Abhaken nimmt den Gedanken aus der Karte, zählt mit und lässt sich zurückholen', async (browser) => {
  const { page, errors } = await open(browser);
  await start(page);
  await node(page, 'Mama anrufen').locator('.ckb').click();
  await page.waitForFunction(() => ![...document.querySelectorAll('.nd')].some((n) => n.textContent.includes('Mama anrufen')), null, { timeout: 6000 });
  assert.match(await page.locator('#doneCount').innerText(), /1 erledigt/);
  assert.match(await page.locator('#coreCount').innerText(), /2 offen/);
  await page.click('#btnList');
  const done = page.locator('.row.done', { hasText: 'Mama anrufen' });
  await done.waitFor({ state: 'visible' });
  await done.locator('.restore').click();
  await page.click('#btnList');
  await node(page, 'Mama anrufen').waitFor({ state: 'visible', timeout: 6000 });
  assert.match(await page.locator('#doneCount').innerText(), /0 erledigt/);
  assert.deepEqual(errors, []);
});

test('Erledigtes lässt sich endgültig löschen', async (browser) => {
  const { page } = await open(browser);
  await start(page);
  await node(page, 'Podcast starten').locator('.ckb').click();
  await page.click('#btnList');
  const done = page.locator('.row.done', { hasText: 'Podcast starten' });
  await done.waitFor({ state: 'visible', timeout: 6000 });
  await done.locator('.del').click();
  await done.waitFor({ state: 'detached', timeout: 4000 });
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.nd.on').length === 2, null, { timeout: 8000 });
  assert.equal(await page.locator('body', { hasText: 'Podcast starten' }).count(), 0);
});

test('Das Detailblatt zeigt den Satz, ändert den Bereich und löscht mit Rückgängig', async (browser) => {
  const { page, errors } = await open(browser);
  await start(page);
  await node(page, 'Mama anrufen').locator('.nb').click();
  await page.waitForSelector('#detail.open');
  assert.match(await page.locator('#detail').innerText(), /Ich muss morgen unbedingt Mama anrufen\./);
  assert.equal(await page.inputValue('#dTitle'), 'Mama anrufen');
  await page.click('#detail [data-cat="a"]');
  await page.waitForFunction(() => [...document.querySelectorAll('.nd.on')].some((n) => n.textContent.includes('Mama anrufen') && n.querySelector('.node.cA')));
  await page.click('#dDelete');
  await page.waitForFunction(() => ![...document.querySelectorAll('.nd.on')].some((n) => n.textContent.includes('Mama anrufen')));
  await page.click('#undo');
  await node(page, 'Mama anrufen').waitFor({ state: 'visible', timeout: 6000 });
  assert.deepEqual(errors, []);
});

test('Der Kern lässt sich im Detailblatt umbenennen', async (browser) => {
  const { page } = await open(browser);
  await start(page);
  await node(page, 'Angebot raus').locator('.nb').click();
  await page.waitForSelector('#detail.open');
  await page.fill('#dTitle', 'Angebot an Kunde');
  await page.click('#bd');
  await node(page, 'Angebot an Kunde').waitFor({ state: 'visible', timeout: 4000 });
});

test('Der PDF-Export enthält die Gedanken sortiert als Text', async (browser) => {
  const { page, errors } = await open(browser);
  await start(page);
  await page.click('#btnExport');
  await page.waitForSelector('#exp.open');
  await page.click('#sortHot');
  assert.match(await page.locator('#paper').innerText(), /WICHTIG|Wichtig/);
  const [download] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.click('#savePdf')]);
  assert.match(download.suggestedFilename(), /^Gedanken-\d{4}-\d{2}-\d{2}\.pdf$/);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gedanken-e2e-')), 'g.pdf');
  await download.saveAs(file);
  const out = execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
  for (const want of ['Gedanken', 'WICHTIG', 'Mama anrufen', 'Angebot raus', 'WEITERE', 'Podcast starten']) assert.ok(out.includes(want), 'fehlt im PDF: ' + want + '\n' + out);
  assert.ok(out.indexOf('Mama anrufen') < out.indexOf('Podcast starten'), 'Wichtiges steht zuerst');
  await page.waitForFunction(() => /gesichert/i.test(document.getElementById('expStatus').textContent));
  assert.deepEqual(errors, []);
});

test('Viele Gedanken überlappen nicht und bleiben im Bild', async (browser) => {
  const cats = ['a', 'p', 'i'];
  const notes = [];
  for (let i = 0; i < 16; i += 1) {
    notes.push({ id: i + 1, title: 'Gedanke Nummer ' + (i + 1), text: 'Satz ' + i, cat: cats[i % 3], important: i % 4 === 0, due: null, created: i + 1, done: null });
  }
  const { page, errors } = await open(browser, { seed: { v: 1, seq: 16, notes, settings: { introSeen: true, sort: 'cat', withDone: false } } });
  await page.waitForFunction(() => document.querySelectorAll('.nd.on').length === 16, null, { timeout: 8000 });
  await settle(page, 1500);
  const info = await page.evaluate(() => {
    const boxes = [...document.querySelectorAll('.nd.on .node, .hub, #core')].map((el) => el.getBoundingClientRect()).map((r) => ({ l: r.left, t: r.top, r: r.right, b: r.bottom }));
    const top = document.getElementById('top').getBoundingClientRect().bottom;
    const bottom = document.getElementById('bottom').getBoundingClientRect().top;
    return { boxes, top, bottom, width: innerWidth, scrollW: document.documentElement.scrollWidth };
  });
  for (let i = 0; i < info.boxes.length; i += 1) {
    const a = info.boxes[i];
    assert.ok(a.l >= -1 && a.r <= info.width + 1, 'seitlich im Bild: ' + JSON.stringify(a));
    assert.ok(a.t >= info.top - 2 && a.b <= info.bottom + 2, 'zwischen Kopf und Fuß: ' + JSON.stringify(a) + ' ' + info.top + '/' + info.bottom);
    for (let j = i + 1; j < info.boxes.length; j += 1) {
      const b = info.boxes[j];
      const apart = a.r <= b.l + 0.5 || b.r <= a.l + 0.5 || a.b <= b.t + 0.5 || b.b <= a.t + 0.5;
      assert.ok(apart, 'Überlappung: ' + JSON.stringify(a) + ' ' + JSON.stringify(b));
    }
  }
  assert.ok(info.scrollW <= info.width, 'kein seitliches Scrollen');
  assert.deepEqual(errors, []);
});

test('Mit allen Animationen: Gedanke fliegt in die Karte und lässt sich abhaken', async (browser) => {
  const { page, errors } = await open(browser, { motion: true });
  await page.click('#introGo', { force: true });
  await page.waitForFunction(() => document.querySelectorAll('.nd.on').length === 3, null, { timeout: 8000 });
  await page.click('#btnType', { force: true });
  await page.fill('#thought', 'Die Steuer ordnen und zwar dringend');
  await page.click('#compAdd', { force: true });
  await page.waitForSelector('#chip.show', { timeout: 8000 });
  const chip = await page.evaluate(() => getComputedStyle(document.getElementById('chip')).height);
  assert.equal(chip, '38px', 'der fliegende Kern behält seine Form');
  await node(page, 'Steuer ordnen').waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForFunction(() => document.getElementById('rp').classList.contains('go'));
  const rip = await page.evaluate(() => getComputedStyle(document.getElementById('rp')).borderRadius);
  assert.equal(rip, '50%', 'die Welle am Kern ist rund');
  await page.waitForFunction(() => document.getElementById('card').getAttribute('data-mode') === 'idle', null, { timeout: 8000 });
  await node(page, 'Steuer ordnen').locator('.ckb').click({ force: true });
  await page.waitForFunction(() => ![...document.querySelectorAll('.nd')].some((n) => n.textContent.includes('Steuer ordnen')), null, { timeout: 6000 });
  assert.match(await page.locator('#doneCount').innerText(), /1 erledigt/);
  assert.deepEqual(errors, []);
});

test('In der Claude-Vorschau wertet die KI den Satz aus', async (browser) => {
  const { page, errors } = await open(browser, { claude: true });
  await start(page);
  await addThought(page, 'Am Sonntag will ich endlich mal wieder bei der Oma vorbeischauen', 'Oma besuchen');
  const asked = await page.evaluate(() => window.__asked);
  assert.equal(asked.length, 1);
  assert.match(asked[0], /bei der Oma vorbeischauen/);
  assert.equal(await node(page, 'Oma besuchen').locator('.node.cP.card').count(), 1, 'Bereich und Wichtigkeit kommen von der KI');
  assert.deepEqual(errors, []);
});

test('In der Claude-Vorschau geht das PDF an die Sichern-Funktion und das Mikrofon öffnet die Eingabe', async (browser) => {
  const { page, errors } = await open(browser, { claude: true });
  await start(page);
  await page.click('#mic');
  await page.waitForSelector('#comp.open');
  assert.equal(await page.evaluate(() => window.__speechUsed === true), false, 'kein Versuch mit dem gesperrten Mikrofon');
  await page.click('#compCancel');
  await page.click('#btnExport');
  await page.waitForSelector('#exp.open');
  assert.match(await page.locator('#locName').innerText(), /beim Sichern gewählt/);
  await page.click('#savePdf');
  await page.waitForFunction(() => /^Gesichert: Gedanken-/.test(document.getElementById('expStatus').textContent));
  const saved = await page.evaluate(() => window.__saved);
  assert.equal(saved.length, 1);
  assert.match(saved[0].filename, /^Gedanken-\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.ok(saved[0].size > 800, 'PDF hat Inhalt: ' + saved[0].size);
  assert.deepEqual(errors, []);
});

test('Der Filter blendet die anderen Bereiche ab', async (browser) => {
  const { page } = await open(browser);
  await start(page);
  await page.click('.seg[data-f="a"]');
  await page.waitForFunction(() => document.querySelectorAll('.nd.on.dim').length === 2);
  assert.equal(await page.locator('.nd.on:not(.dim)', { hasText: 'Angebot raus' }).count(), 1);
  await page.click('.seg[data-f=""]');
  await page.waitForFunction(() => document.querySelectorAll('.nd.on.dim').length === 0);
});

test('Im dunklen Design ist der Hintergrund dunkel und die Schrift hell', async (browser) => {
  const { page } = await open(browser, { dark: true });
  await start(page);
  const c = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, fg: getComputedStyle(document.body).color }));
  const lum = (s) => { const m = s.match(/\d+/g).map(Number); return (m[0] + m[1] + m[2]) / 3; };
  assert.ok(lum(c.bg) < 60, 'Hintergrund: ' + c.bg);
  assert.ok(lum(c.fg) > 190, 'Schrift: ' + c.fg);
});

(async () => {
  const only = process.argv[2];
  const server = process.env.GEDANKEN_URL ? null : await startServer(PORT);
  const browser = await chromium.launch();
  let failed = 0;
  for (const t of tests) {
    if (only && !t.name.includes(only)) continue;
    const t0 = Date.now();
    try {
      await t.fn(browser);
      console.log('ok   ' + t.name + ' (' + (Date.now() - t0) + ' ms)');
    } catch (e) {
      failed += 1;
      console.log('FAIL ' + t.name + '\n     ' + String(e && e.message ? e.message : e).split('\n').slice(0, 6).join('\n     '));
    }
    for (const c of browser.contexts()) await c.close();
  }
  await browser.close();
  if (server) server.close();
  console.log(failed ? failed + ' Test(s) fehlgeschlagen' : 'Alle Oberflächen-Tests bestanden');
  process.exit(failed ? 1 : 0);
})();
