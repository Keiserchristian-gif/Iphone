import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vocab } from '../js/data/vocab.js';
import { exercises } from '../js/data/exercises.js';
import { skills, workflow } from '../js/data/skills.js';
import { analyzePrompt } from '../js/prompt-check.js';

const GRUPPEN = ['Layout', 'Typografie', 'Farbe', 'Abstand', 'Interaktion', 'Bewegung'];
const filled = (v) => typeof v === 'string' && v.trim() !== '';

test('vocab: >= 25 Einträge, Pflichtfelder, eindeutige IDs, alle 6 Gruppen', () => {
  assert.ok(vocab.length >= 25);
  const ids = new Set();
  for (const v of vocab) {
    for (const f of ['id', 'begriff', 'gruppe', 'erklaerung', 'promptBaustein']) assert.ok(filled(v[f]), `${v.id} ohne ${f}`);
    assert.ok(GRUPPEN.includes(v.gruppe), `${v.id}: unbekannte Gruppe`);
    ids.add(v.id);
  }
  assert.equal(ids.size, vocab.length);
  for (const g of GRUPPEN) assert.ok(vocab.some((v) => v.gruppe === g), `Gruppe ${g} fehlt`);
});

test('exercises: genau 10, Pflichtfelder, eindeutige IDs, muster score >= 4', () => {
  assert.equal(exercises.length, 10);
  const ids = new Set();
  for (const e of exercises) {
    for (const f of ['id', 'vage', 'hinweis', 'muster']) assert.ok(filled(e[f]), `${e.id} ohne ${f}`);
    assert.ok(analyzePrompt(e.muster).score >= 4, `${e.id}: muster score ${analyzePrompt(e.muster).score}`);
    assert.ok(analyzePrompt(e.vage).score <= 2, `${e.id}: vage zu präzise`);
    ids.add(e.id);
  }
  assert.equal(ids.size, 10);
});

test('skills: exakt die fünf Skills, alle Felder; workflow geordnet', () => {
  assert.deepEqual(
    skills.map((s) => s.name),
    ['frontend-design', 'website-design:design-system', 'website-design:landing-page', 'website-design:web-review', 'superdesign'],
  );
  for (const s of skills) for (const f of ['name', 'wann', 'warum', 'beispielprompt']) assert.ok(filled(s[f]), `${s.name} ohne ${f}`);
  assert.ok(workflow.length >= 4 && workflow.every(filled));
  const idx = (re) => workflow.findIndex((w) => re.test(w));
  assert.ok(idx(/Richtung/i) < idx(/Design-System/i));
  assert.ok(idx(/Design-System/i) < idx(/bauen/i));
  assert.ok(idx(/bauen/i) < idx(/review/i));
});
