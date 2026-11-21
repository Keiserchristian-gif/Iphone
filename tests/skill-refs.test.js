import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildRefs, REFS_DIR } from '../scripts/build-skill-refs.mjs';
import { vocab } from '../js/data/vocab.js';
import { directions, traps } from '../js/data/directions.js';

test('generated skill references are up to date with the trainer data', () => {
  for (const [name, text] of Object.entries(buildRefs())) {
    assert.equal(readFileSync(join(REFS_DIR, name), 'utf8'), text,
      `${name} ist veraltet: node scripts/build-skill-refs.mjs ausführen`);
  }
});

test('references contain every vocab term, direction and trap', () => {
  const refs = buildRefs();
  for (const v of vocab) assert.ok(refs['vokabeln.md'].includes(`**${v.begriff}**`), v.begriff);
  for (const d of directions) assert.ok(refs['richtungen.md'].includes(`## ${d.name} (Mut ${d.mut})`), d.id);
  for (const t of traps) assert.ok(refs['fallen.md'].includes(t), t.slice(0, 30));
});
