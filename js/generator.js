// Richtungs-Generator: deterministisch per Seed, DOM-frei.
import { directions } from './data/directions.js';

function mulberry32(a) {
  let t = (Number.isFinite(a) ? Math.trunc(a) : 0) >>> 0;
  return function rand() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clampMut(mut) {
  const n = Number(mut);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export function pickDirection(mut, seed) {
  const m = clampMut(mut);
  let pool = directions.filter((d) => Math.abs(d.mut - m) <= 25);
  if (pool.length === 0) {
    const best = Math.min(...directions.map((d) => Math.abs(d.mut - m)));
    pool = directions.filter((d) => Math.abs(d.mut - m) === best);
  }
  return pool[Math.floor(mulberry32(seed)() * pool.length)];
}

export function mixDirections(seed) {
  const rand = mulberry32(seed);
  const i = Math.floor(rand() * directions.length);
  let j = Math.floor(rand() * (directions.length - 1));
  if (j >= i) j += 1;
  const a = directions[i];
  const b = directions[j];
  const schrift = b.schriften[Math.floor(rand() * b.schriften.length)];
  const farben = a.farben.slice();
  const prompt =
    `Gestalte die Überschrift und den Hero-Hintergrund als Mischung aus „${a.name}“ und „${b.name}“: ` +
    `Farben ${farben.join(', ')} aus „${a.name}“, Schrift ${schrift} mit 12vw Größe aus „${b.name}“. ` +
    `Layout: ${a.layout} Bewegung: ${b.bewegung} ` +
    `Der Stil wirkt mutig, überraschend und eigenständig. Nur den Hero ändern, nichts anderes anfassen.`;
  return { farben, schrift, layout: a.layout, bewegung: b.bewegung, prompt, quellen: [a.id, b.id] };
}
