import { test } from 'node:test';
import assert from 'node:assert/strict';
import { directions, traps } from '../js/data/directions.js';
import { pickDirection, mixDirections } from '../js/generator.js';
import { analyzePrompt } from '../js/prompt-check.js';

const FIELDS = ['id', 'name', 'mut', 'beschreibung', 'farben', 'schriften', 'layout', 'bewegung', 'prompt'];

test('mindestens 12 Richtungen mit allen Feldern, 3-5 Hex-Farben', () => {
  assert.ok(directions.length >= 12);
  for (const d of directions) {
    for (const f of FIELDS) assert.ok(d[f] !== undefined && d[f] !== '', `${d.id} ohne ${f}`);
    assert.ok(d.farben.length >= 3 && d.farben.length <= 5, `${d.id} Farbanzahl`);
    for (const c of d.farben) assert.match(c, /^#[0-9a-fA-F]{6}$/);
    assert.ok(Array.isArray(d.schriften) && d.schriften.length >= 1);
    assert.ok(d.mut >= 0 && d.mut <= 100);
  }
});

test('ids und Namen sind eindeutig', () => {
  assert.equal(new Set(directions.map((d) => d.id)).size, directions.length);
  assert.equal(new Set(directions.map((d) => d.name)).size, directions.length);
});

test('jede Richtung hat einen Prompt mit mindestens 4 von 5 Bausteinen', () => {
  for (const d of directions) {
    assert.ok(analyzePrompt(d.prompt).score >= 4, `${d.id}: Score ${analyzePrompt(d.prompt).score}`);
  }
});

test('jeder Mut-Bereich hat mindestens 2 Richtungen', () => {
  const bands = [[0, 25], [26, 50], [51, 75], [76, 100]];
  for (const [lo, hi] of bands) {
    assert.ok(directions.filter((d) => d.mut >= lo && d.mut <= hi).length >= 2, `Band ${lo}-${hi}`);
  }
});

test('pickDirection respektiert den Mut-Bereich', () => {
  assert.ok(pickDirection(100, 7).mut >= 75);
  assert.ok(pickDirection(0, 7).mut <= 25);
  for (const m of [0, 25, 50, 75, 100]) {
    for (let s = 0; s < 20; s++) assert.ok(Math.abs(pickDirection(m, s).mut - m) <= 25);
  }
});

test('gleicher Seed liefert gleiche Richtung', () => {
  assert.equal(pickDirection(50, 123).id, pickDirection(50, 123).id);
});

test('verschiedene Seeds streuen über mehrere Richtungen', () => {
  const ids = new Set();
  for (let s = 0; s < 50; s++) ids.add(pickDirection(50, s).id);
  assert.ok(ids.size >= 2);
});

test('Mut außerhalb 0-100 oder ungültig wirft nicht', () => {
  for (const m of [-5, 500, NaN, undefined]) {
    assert.ok(pickDirection(m, 1).id);
  }
  assert.ok(pickDirection(50, undefined).id);
});

test('traps: mindestens 8 Sätze', () => {
  assert.ok(traps.length >= 8);
  for (const t of traps) assert.ok(typeof t === 'string' && t.length > 20);
});

test('mixDirections ist deterministisch und vollständig', () => {
  const a = mixDirections(42);
  const b = mixDirections(42);
  assert.deepEqual(a, b);
  assert.ok(Array.isArray(a.farben) && a.farben.length >= 3);
  assert.ok(a.schrift && a.layout && a.bewegung && a.prompt);
  assert.ok(analyzePrompt(a.prompt).score >= 4);
  assert.ok(a.quellen.length === 2 && a.quellen[0] !== a.quellen[1]);
});

test('Mix-Prompt hat keine fest verdrahtete 12vw-Größe und rahmt das Layout als Hero-Idee', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const m = mixDirections(seed);
    if (!m.layout.includes('12vw')) assert.ok(!m.prompt.includes('12vw'), `seed ${seed}`);
    assert.ok(m.prompt.includes('Layout-Idee (nur im Hero umsetzen):'));
  }
});
