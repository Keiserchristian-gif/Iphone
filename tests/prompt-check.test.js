import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePrompt } from '../js/prompt-check.js';

test('leer und nur Leerzeichen', () => {
  for (const t of ['', '   ']) {
    const r = analyzePrompt(t);
    assert.equal(r.empty, true);
    assert.equal(r.score, 0);
  }
});

test('vager Prompt', () => {
  const r = analyzePrompt('mach das cooler');
  assert.ok(r.score <= 1);
  assert.ok(r.missing.length >= 4);
});

test('vollständiger Prompt', () => {
  const r = analyzePrompt('Ändere die Überschrift im Hero auf 96px, Schrift Serif, Farbe #111, wirkt wie ein Zeitungs-Poster, nichts anderes anfassen');
  for (const k of ['element', 'property', 'value', 'mood', 'limit']) assert.equal(r.found[k], true, k);
  assert.equal(r.score, 5);
  assert.equal(r.missing.length, 0);
});

test('englisch', () => {
  const r = analyzePrompt('make the hero heading bigger');
  assert.equal(r.found.element, true);
  assert.equal(r.found.property, true);
});

test('Umlaute und Großschreibung', () => {
  const r = analyzePrompt('ÜBERSCHRIFT größe');
  assert.equal(r.found.element, true);
  assert.equal(r.found.property, true);
  assert.equal(analyzePrompt('groesse').found.property, true);
});

test('improved enthält Platzhalter', () => {
  const r = analyzePrompt('mach das cooler');
  assert.match(r.improved, /\[[^\]]+\]/);
});
