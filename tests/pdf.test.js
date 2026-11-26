'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const pdf = require('../src/pdf.js');

const DOC = {
  title: 'Gedanken',
  subtitle: 'Stand 26.11.2026 · sortiert nach Bereich',
  groups: [
    { title: 'Arbeit', items: [{ title: 'Angebot senden', meta: 'Morgen · wichtig', text: 'Das Angebot muss bis Freitag raus.', done: false, important: true }] },
    { title: 'Privat', items: [{ title: 'Größe der Schuhe prüfen', meta: 'Überfällig', text: 'Größe prüfen – „Laufschuhe“ für Jörg', done: false, important: false }] },
    { title: 'Erledigt', items: [{ title: 'Müll rausbringen', meta: '', text: 'Müll', done: true, important: false }] }
  ]
};

function text(bytes) {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gedanken-')), 't.pdf');
  fs.writeFileSync(file, Buffer.from(bytes));
  return execFileSync('pdftotext', ['-layout', file, '-'], { encoding: 'utf8' });
}

test('buildPdf liefert eine PDF-Datei', () => {
  const bytes = pdf.buildPdf(DOC);
  assert.ok(bytes instanceof Uint8Array);
  const s = Buffer.from(bytes).toString('latin1');
  assert.ok(s.startsWith('%PDF-1.4'));
  assert.ok(s.trimEnd().endsWith('%%EOF'));
});

test('die Querverweistabelle zeigt auf die Objekte', () => {
  const s = Buffer.from(pdf.buildPdf(DOC)).toString('latin1');
  const start = Number(s.match(/startxref\s+(\d+)/)[1]);
  assert.ok(s.slice(start).startsWith('xref'));
  const rows = s.slice(start).split('\n').filter((l) => /^\d{10} \d{5} n/.test(l));
  assert.ok(rows.length >= 5);
  rows.forEach((row, i) => {
    const off = Number(row.slice(0, 10));
    assert.ok(s.slice(off).startsWith((i + 1) + ' 0 obj'), 'Objekt ' + (i + 1));
  });
});

test('der Text samt Umlauten steht lesbar im PDF', () => {
  const out = text(pdf.buildPdf(DOC));
  for (const want of ['Gedanken', 'Stand 26.11.2026', 'ARBEIT', 'Angebot senden', 'Morgen · wichtig', 'Größe der Schuhe prüfen', 'Überfällig', 'Jörg', 'Müll rausbringen']) {
    assert.ok(out.includes(want), 'fehlt: ' + want + '\n' + out);
  }
});

test('viele Gedanken laufen auf weitere Seiten', () => {
  const items = [];
  for (let i = 0; i < 90; i += 1) items.push({ title: 'Gedanke Nummer ' + i, meta: '', text: 'Ein längerer gesprochener Satz zu Gedanke Nummer ' + i + '.', done: false, important: false });
  const bytes = pdf.buildPdf({ title: 'Gedanken', subtitle: 'x', groups: [{ title: 'Privat', items }] });
  const s = Buffer.from(bytes).toString('latin1');
  const pages = (s.match(/\/Type \/Page\b/g) || []).length;
  assert.ok(pages >= 2, 'Seiten: ' + pages);
  const out = text(bytes);
  assert.ok(out.includes('Gedanke Nummer 0'));
  assert.ok(out.includes('Gedanke Nummer 89'));
});

test('wrap bricht lange Zeilen an Wortgrenzen', () => {
  const lines = pdf.wrap('eins zwei drei vier fünf sechs sieben acht neun zehn', 10, 100);
  assert.ok(lines.length > 1);
  assert.equal(lines.join(' '), 'eins zwei drei vier fünf sechs sieben acht neun zehn');
  lines.forEach((l) => assert.ok(pdf.textWidth(l, 10) <= 100, l));
});
