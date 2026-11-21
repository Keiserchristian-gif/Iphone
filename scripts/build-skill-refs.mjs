// Erzeugt die Referenzdateien des design-coach-Skills aus den Daten des Trainers.
// Aufruf: node scripts/build-skill-refs.mjs   (schreibt nach .claude/skills/design-coach/references/)
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { vocab } from '../js/data/vocab.js';
import { directions, traps } from '../js/data/directions.js';

const HEADER = '<!-- Automatisch erzeugt von scripts/build-skill-refs.mjs. Nicht von Hand ändern. -->\n\n';

export function buildRefs() {
  const groups = [...new Set(vocab.map((v) => v.gruppe))];
  const vokabeln = HEADER + '# Vokabeln: wie heißt was\n\n' + groups.map((g) =>
    `## ${g}\n\n` + vocab.filter((v) => v.gruppe === g)
      .map((v) => `- **${v.begriff}**: ${v.erklaerung}\n  Baustein: „${v.promptBaustein}“`).join('\n')
  ).join('\n\n') + '\n';

  const sorted = [...directions].sort((a, b) => a.mut - b.mut);
  const richtungen = HEADER + '# Gegenrichtungen zum Standard (nach Mut-Stufe 0 = vertraut, 100 = extrem)\n\n' +
    sorted.map((d) =>
      `## ${d.name} (Mut ${d.mut})\n\n${d.beschreibung}\n\n` +
      `- Farben: ${d.farben.join(', ')}\n- Schriften (Google Fonts): ${d.schriften.join(', ')}\n` +
      `- Layout: ${d.layout}\n- Bewegung: ${d.bewegung}\n- Startprompt: ${d.prompt}`
    ).join('\n\n') + '\n';

  const fallen = HEADER + '# Standard-Fallen (das machen alle: vermeiden)\n\n' +
    traps.map((t) => `- ${t}`).join('\n') + '\n';

  return { 'vokabeln.md': vokabeln, 'richtungen.md': richtungen, 'fallen.md': fallen };
}

export const REFS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.claude', 'skills', 'design-coach', 'references');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(REFS_DIR, { recursive: true });
  for (const [name, text] of Object.entries(buildRefs())) writeFileSync(join(REFS_DIR, name), text);
  console.log('Referenzen geschrieben nach', REFS_DIR);
}
