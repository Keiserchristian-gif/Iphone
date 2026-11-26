'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');

const TODAY = '2026-11-26'; // ein Donnerstag

test('analyze zieht den Kern aus einem gesprochenen Satz', () => {
  const [n] = core.analyze('Ich muss morgen unbedingt Mama anrufen.', TODAY);
  assert.equal(n.title, 'Mama anrufen');
  assert.equal(n.cat, 'p');
  assert.equal(n.due, '2026-11-27');
  assert.equal(n.important, true);
  assert.equal(n.text, 'Ich muss morgen unbedingt Mama anrufen.');
});

test('analyze erkennt Arbeit und einen Wochentag als Termin', () => {
  const [n] = core.analyze('Das Angebot muss bis Freitag raus', TODAY);
  assert.equal(n.cat, 'a');
  assert.equal(n.due, '2026-11-27');
  assert.match(n.title, /^Angebot/);
});

test('analyze erkennt eine Idee ohne Termin', () => {
  const [n] = core.analyze('Idee: einen eigenen Podcast starten', TODAY);
  assert.equal(n.cat, 'i');
  assert.equal(n.title, 'Podcast starten');
  assert.equal(n.due, null);
  assert.equal(n.important, false);
});

test('der heutige Wochentag meint die nächste Woche', () => {
  const [n] = core.analyze('Am Donnerstag zum Zahnarzt', TODAY);
  assert.equal(n.due, '2026-12-03');
});

test('ein Datum wie 3.12. wird als Termin gelesen', () => {
  const [n] = core.analyze('Am 3.12. Reifen wechseln', TODAY);
  assert.equal(n.due, '2026-12-03');
  assert.equal(n.title, 'Reifen wechseln');
});

test('mehrere Sätze ergeben mehrere Gedanken', () => {
  const list = core.analyze('Mama anrufen. Außerdem das Angebot schicken.', TODAY);
  assert.equal(list.length, 2);
  assert.equal(list[0].title, 'Mama anrufen');
  assert.equal(list[1].cat, 'a');
});

test('leerer Text ergibt nichts', () => {
  assert.deepEqual(core.analyze('   ', TODAY), []);
});

test('der Kern bleibt kurz', () => {
  const [n] = core.analyze('Donaudampfschifffahrtsgesellschaftskapitän Versicherungsunterlagen heraussuchen', TODAY);
  assert.ok(n.title.length <= 24, n.title);
  assert.ok(n.title.endsWith('…'));
});

test('dueLabel beschreibt den Termin relativ zu heute', () => {
  assert.equal(core.dueLabel('2026-11-26', TODAY), 'Heute');
  assert.equal(core.dueLabel('2026-11-27', TODAY), 'Morgen');
  assert.equal(core.dueLabel('2026-11-20', TODAY), 'Überfällig');
  assert.equal(core.dueLabel('2026-11-30', TODAY), 'Mo., 30.11.');
  assert.equal(core.dueLabel(null, TODAY), '');
});

test('normalizeAI übernimmt gültige KI-Antworten', () => {
  const list = core.normalizeAI([{ title: 'Oma besuchen', cat: 'p', important: true, due: '2026-11-29' }], 'Am Sonntag Oma besuchen', TODAY);
  assert.deepEqual(list, [{ title: 'Oma besuchen', cat: 'p', important: true, due: '2026-11-29', text: 'Am Sonntag Oma besuchen' }]);
});

test('normalizeAI repariert Bereich und Termin und verwirft Unbrauchbares', () => {
  const list = core.normalizeAI({ title: '  Steuer machen. ', cat: 'x', important: 'ja', due: 'bald' }, 'Steuer', TODAY);
  assert.equal(list[0].title, 'Steuer machen');
  assert.equal(list[0].cat, 'p');
  assert.equal(list[0].due, null);
  assert.equal(list[0].important, false);
  assert.equal(core.normalizeAI([{ cat: 'a' }], 'x', TODAY), null);
  assert.equal(core.normalizeAI('quatsch', 'x', TODAY), null);
});

function overlaps(a, b, gap) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + gap && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + gap;
}

test('place setzt viele Gedanken ohne Überlappung', () => {
  const rects = [];
  const cats = ['a', 'p', 'i'];
  for (let i = 0; i < 45; i += 1) {
    const size = { w: 120 + (i % 4) * 14, h: i % 5 === 0 ? 58 : 40 };
    const pos = core.place(size, rects, cats[i % 3]);
    const r = { x: pos.x, y: pos.y, w: size.w, h: size.h };
    for (const other of rects.concat(core.fixedRects())) {
      assert.ok(!overlaps(r, other, 0), 'Überlappung bei Gedanke ' + i);
    }
    rects.push(r);
  }
});

test('place bleibt im Sektor des Bereichs', () => {
  const rects = [];
  for (let i = 0; i < 8; i += 1) {
    const pos = core.place({ w: 130, h: 40 }, rects, 'i');
    assert.ok(pos.y > 60, 'Ideen liegen unter dem Kern');
    rects.push({ x: pos.x, y: pos.y, w: 130, h: 40 });
  }
  const left = core.place({ w: 130, h: 40 }, [], 'a');
  assert.ok(left.x < 0, 'Arbeit liegt links');
});

const NOTES = [
  { id: 1, title: 'Podcast starten', text: 'Idee: Podcast', cat: 'i', important: false, due: null, created: 1, done: null },
  { id: 2, title: 'Angebot senden', text: 'Angebot raus', cat: 'a', important: true, due: '2026-11-27', created: 2, done: null },
  { id: 3, title: 'Steuer ordnen', text: 'Steuer', cat: 'a', important: false, due: null, created: 3, done: null },
  { id: 4, title: 'Mama anrufen', text: 'Mama', cat: 'p', important: true, due: '2026-11-26', created: 4, done: null },
  { id: 5, title: 'Müll rausbringen', text: 'Müll', cat: 'p', important: false, due: null, created: 5, done: 99 }
];

test('docModel sortiert nach Bereich, Wichtiges zuerst', () => {
  const doc = core.docModel(NOTES, { sort: 'cat', withDone: false }, TODAY);
  assert.deepEqual(doc.groups.map((g) => g.title), ['Arbeit', 'Privat', 'Ideen']);
  assert.deepEqual(doc.groups[0].items.map((i) => i.title), ['Angebot senden', 'Steuer ordnen']);
  assert.equal(doc.groups[0].items[0].meta, 'Morgen · wichtig');
  assert.equal(doc.groups[1].items.length, 1);
});

test('docModel sortiert nach Wichtigkeit und Termin', () => {
  const doc = core.docModel(NOTES, { sort: 'hot', withDone: false }, TODAY);
  assert.deepEqual(doc.groups.map((g) => g.title), ['Wichtig', 'Weitere']);
  assert.deepEqual(doc.groups[0].items.map((i) => i.title), ['Mama anrufen', 'Angebot senden']);
});

test('docModel nimmt Erledigtes nur auf Wunsch auf', () => {
  const doc = core.docModel(NOTES, { sort: 'cat', withDone: true }, TODAY);
  const last = doc.groups[doc.groups.length - 1];
  assert.equal(last.title, 'Erledigt');
  assert.equal(last.items[0].title, 'Müll rausbringen');
  assert.equal(last.items[0].done, true);
});

test('docModel nennt Datum und Sortierung', () => {
  const doc = core.docModel(NOTES, { sort: 'cat', withDone: false }, TODAY);
  assert.equal(doc.title, 'MindDesk');
  assert.match(doc.subtitle, /26\.11\.2026/);
  assert.match(doc.subtitle, /Bereich/);
  assert.equal(core.fileName(TODAY), 'MindDesk-2026-11-26.pdf');
});

test('isFree erkennt belegte und freie Plätze', () => {
  const taken = [{ x: 200, y: 200, w: 100, h: 40 }];
  assert.equal(core.isFree({ x: 210, y: 205, w: 100, h: 40 }, taken), false, 'liegt auf einem anderen Gedanken');
  assert.equal(core.isFree({ x: 0, y: 10, w: 100, h: 40 }, []), false, 'liegt auf dem Kern');
  assert.equal(core.isFree({ x: 400, y: 400, w: 100, h: 40 }, taken), true);
});

test('titleFlags markiert die Wörter des Kerns im gesprochenen Satz', () => {
  const words = 'Am Sonntag will ich unbedingt Oma besuchen'.split(' ');
  assert.deepEqual(core.titleFlags(words, ['Oma besuchen']), [false, false, false, false, false, true, true]);
  assert.deepEqual(core.titleFlags(['Steuer', 'machen'], ['Etwas ganz anderes']), core.keyFlags(['Steuer', 'machen']));
});

test('ein zu langer Kern verliert ganze Wörter statt mitten im Wort zu enden', () => {
  const [n] = core.analyze('Die Präsentation für den Kunden fertig machen', TODAY);
  assert.equal(n.title, 'Präsentation Kunden');
});

test('Füllwörter gehören nicht in den Kern', () => {
  assert.equal(core.analyze('Die Steuer ordnen und zwar dringend', TODAY)[0].title, 'Steuer ordnen');
  assert.equal(core.analyze('Ich sollte eigentlich mal wieder joggen gehen', TODAY)[0].title, 'Joggen gehen');
});

test('mit Kalender gibt es einen vierten Bereich, und nichts überlappt', () => {
  const lay = core.layoutFor(true);
  assert.deepEqual(Object.keys(lay.hubs), ['a', 'p', 'i', 'k']);
  assert.deepEqual(Object.keys(core.layoutFor(false).hubs), ['a', 'p', 'i']);
  const rects = [];
  ['a', 'p', 'i', 'k'].forEach((c) => {
    for (let n = 0; n < 6; n += 1) {
      const size = { w: 150, h: n % 2 ? 58 : 40 };
      const pos = core.place(size, rects, c, lay);
      const r = { x: pos.x, y: pos.y, w: size.w, h: size.h };
      for (const other of rects.concat(core.fixedRects(lay))) assert.ok(!overlaps(r, other, 0), 'Überlappung in ' + c + n);
      assert.ok(core.isFree({ x: pos.x, y: pos.y, w: size.w, h: size.h }, rects, lay));
      rects.push(r);
    }
  });
  const cal = core.place({ w: 150, h: 58 }, [], 'k', lay);
  assert.ok(cal.x > 0 && cal.y > 0, 'Termine liegen rechts unten');
});

test('docText liefert den sortierten Text für eine Mail', () => {
  const doc = core.docModel(NOTES, { sort: 'cat', withDone: false }, TODAY);
  const text = core.docText(doc);
  assert.ok(text.startsWith('MindDesk\nStand 26.11.2026'));
  assert.ok(text.includes('\nARBEIT\n- Angebot senden (Morgen · wichtig)\n- Steuer ordnen\n'));
  assert.ok(text.indexOf('ARBEIT') < text.indexOf('PRIVAT'));
});
