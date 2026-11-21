import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fontQuery, headWeight, BOLD_WEIGHT } from '../js/fonts.js';
import { directions } from '../js/data/directions.js';

test('Familien, die nur bis 700 gehen, werden nie mit 800 angefragt', () => {
  assert.equal(fontQuery('Space Mono'), 'family=Space+Mono:wght@400;700&display=swap');
  assert.equal(fontQuery('Courier Prime'), 'family=Courier+Prime:wght@400;700&display=swap');
  assert.equal(fontQuery('IBM Plex Mono'), 'family=IBM+Plex+Mono:wght@400;700&display=swap');
  assert.equal(headWeight('Space Mono'), 700);
});

test('Familien ohne belegten Fettschnitt: keine Achse, Gewicht 400', () => {
  assert.equal(fontQuery('VT323'), 'family=VT323&display=swap');
  assert.equal(fontQuery('Source Serif 4'), 'family=Source+Serif+4:wght@400;800&display=swap');
  assert.equal(headWeight('Monoton'), 400);
});

test('Tabelle nennt nur Schriften aus den Richtungen, Gewicht passt zur Abfrage', () => {
  const used = new Set(directions.flatMap((d) => d.schriften));
  for (const [family, w] of Object.entries(BOLD_WEIGHT)) {
    assert.ok(used.has(family), `${family} wird nicht benutzt`);
    assert.ok(w === 700 || w === 800);
    assert.ok(fontQuery(family).includes(`:wght@400;${w}&`));
    assert.equal(headWeight(family), w);
  }
  for (const family of used) assert.ok(!/[^A-Za-z0-9+]/.test(fontQuery(family).split('&')[0].slice(7).split(':')[0]));
});

test('Archivo Black hat nur Gewicht 400: Abfrage ohne Achse', () => {
  assert.equal(fontQuery('Archivo Black'), 'family=Archivo+Black&display=swap');
  assert.equal(headWeight('Archivo Black'), 400);
  assert.ok(directions.find((d) => d.id === 'swiss-poster').schriften.includes('Archivo Black'));
});
