// Design-Trainer · Oberfläche. Jeder Bereich hat seine eigene init-Funktion.
import { vocab } from './data/vocab.js';
import { exercises } from './data/exercises.js';
import { analyzePrompt } from './prompt-check.js';
import { pickDirection, mixDirections } from './generator.js';
import { directions, traps } from './data/directions.js';
import { skills, workflow } from './data/skills.js';

const GROUPS = ['Layout', 'Typografie', 'Farbe', 'Abstand', 'Interaktion', 'Bewegung'];
const byId = new Map(vocab.map((v) => [v.id, v]));
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
};

/* ───────── Kopieren (wird auch von Werkstatt, Inspiration und Skills genutzt) ───────── */

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* weiter mit dem Fallback */ }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '0';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

// Verbindet einen Knopf mit copyText und einer Statuszeile.
export function bindCopy(button, getText, statusEl) {
  let timer;
  button.addEventListener('click', async () => {
    const ok = await copyText(getText());
    if (statusEl) {
      statusEl.textContent = ok ? 'Kopiert' : 'Bitte manuell kopieren';
      clearTimeout(timer);
      timer = setTimeout(() => { statusEl.textContent = ''; }, 2600);
    }
  });
}

/* ───────── Rahmen: Zahlen, Laufband, aktive Navigation ───────── */

function initShell() {
  document.querySelectorAll('[data-count="vocab"]').forEach((n) => { n.textContent = String(vocab.length); });

  const track = $('#marquee-track');
  if (track) {
    const run = el('div', 'marquee__run');
    // zweimal hintereinander, damit die Schleife nahtlos ist
    for (let pass = 0; pass < 2; pass += 1) {
      vocab.forEach((v) => {
        run.append(el('span', null, v.begriff));
        run.append(el('span', 'star', '✶'));
      });
    }
    track.append(run);
  }

  const links = [...document.querySelectorAll('.mast__nav a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          const on = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-current', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach((s) => io.observe(s));
  }
}

/* ───────── 01 · Vokabel-Atlas ───────── */

function initAtlas() {
  const detail = $('#atlas-detail');
  if (!detail) return;
  const groupEl = $('#detail-group');
  const termEl = $('#detail-term');
  const textEl = $('#detail-text');
  const brickWrap = $('#detail-brick');
  const promptEl = $('#detail-prompt');
  const statusEl = $('#detail-status');
  const parts = [...document.querySelectorAll('.wf__part[data-vocab-id]')];

  let pinned = null;   // angetipptes / angeklicktes Teil
  let shown = null;    // aktuell gezeigte Vokabel-ID

  function show(id) {
    const v = byId.get(id);
    if (!v || shown === id) return;
    shown = id;
    groupEl.textContent = v.gruppe;
    termEl.textContent = v.begriff;
    textEl.textContent = v.erklaerung;
    promptEl.textContent = v.promptBaustein;
    statusEl.textContent = '';
    brickWrap.hidden = false;
    detail.classList.remove('is-flash');
    void detail.offsetWidth; // Animation neu starten
    detail.classList.add('is-flash');
  }

  function mark(part) {
    parts.forEach((p) => {
      const on = p === part;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function pin(part) {
    pinned = part;
    mark(part);
    show(part.dataset.vocabId);
    detail.classList.add('is-open');
    keepVisible(part);
  }

  // Mobil liegt die Tafel unten über der Seite: das angetippte Teil bleibt darüber sichtbar.
  function keepVisible(part) {
    if (getComputedStyle(detail).position !== 'fixed') return;
    requestAnimationFrame(() => {
      const sheetTop = window.innerHeight - detail.offsetHeight - 8;
      const r = part.getBoundingClientRect();
      const overlap = r.bottom - (sheetTop - 16);
      if (overlap > 0) {
        const shift = Math.min(overlap, Math.max(0, r.top - 12));
        if (shift > 0) window.scrollBy({ top: shift, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      }
    });
  }

  function close() {
    detail.classList.remove('is-open');
    if (pinned) pinned.focus({ preventScroll: true });
  }

  parts.forEach((part) => {
    const v = byId.get(part.dataset.vocabId);
    if (!v) return;
    part.type = 'button';
    part.dataset.label = v.begriff;
    part.setAttribute('aria-label', `${v.begriff} erklären`);
    part.setAttribute('aria-controls', 'atlas-detail');
    part.setAttribute('aria-pressed', 'false');

    part.addEventListener('click', () => pin(part));
    part.addEventListener('focus', () => { if (part.matches(':focus-visible')) show(v.id); });
    part.addEventListener('mouseenter', () => { if (canHover.matches) show(v.id); });
    part.addEventListener('mouseleave', () => {
      if (canHover.matches && pinned) show(pinned.dataset.vocabId);
    });
  });

  $('.detail__close', detail).addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && detail.classList.contains('is-open')) close();
  });

  bindCopy($('#detail-copy'), () => promptEl.textContent, statusEl);

  initLexicon();
}

function initLexicon() {
  const list = $('#lexicon-list');
  const filters = $('#lexicon-filters');
  const count = $('#lexicon-count');
  if (!list || !filters) return;

  const rows = vocab.map((v) => {
    const li = el('li', 'entry');
    li.id = `begriff-${v.id}`;
    li.dataset.gruppe = v.gruppe;

    const name = el('div', 'entry__name');
    name.append(el('h4', 'entry__term', v.begriff), el('span', 'entry__group label', v.gruppe));

    const text = el('p', 'entry__text', v.erklaerung);

    const brick = el('div', 'entry__brick');
    const prompt = el('p', 'brick', v.promptBaustein);
    const btn = el('button', 'btn-copy', 'Kopieren');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Baustein zu ${v.begriff} kopieren`);
    const status = el('span', 'copy-status');
    status.setAttribute('role', 'status');
    const actions = el('div');
    actions.append(btn, status);
    brick.append(prompt, actions);
    bindCopy(btn, () => v.promptBaustein, status);

    li.append(name, text, brick);
    list.append(li);
    return li;
  });

  const options = ['Alle', ...GROUPS];
  const buttons = options.map((g) => {
    const b = el('button', 'filter', g);
    b.type = 'button';
    const n = g === 'Alle' ? vocab.length : vocab.filter((v) => v.gruppe === g).length;
    b.append(el('sup', null, String(n)));
    b.setAttribute('aria-pressed', g === 'Alle' ? 'true' : 'false');
    b.addEventListener('click', () => apply(g));
    filters.append(b);
    return b;
  });

  function apply(group) {
    let visible = 0;
    rows.forEach((li) => {
      const on = group === 'Alle' || li.dataset.gruppe === group;
      li.hidden = !on;
      if (on) visible += 1;
    });
    buttons.forEach((b, i) => b.setAttribute('aria-pressed', options[i] === group ? 'true' : 'false'));
    count.textContent = group === 'Alle' ? `${visible} Begriffe in 6 Gruppen` : `${visible} Begriffe in ${group}`;
  }
  apply('Alle');
}

/* ───────── 02 · Prompt-Werkstatt ───────── */

const BLOCKS = [
  { key: 'element', name: 'Element' },
  { key: 'property', name: 'Eigenschaft' },
  { key: 'value', name: 'Wert' },
  { key: 'mood', name: 'Stimmung' },
  { key: 'limit', name: 'Grenze' },
];

function band(score) {
  if (score <= 1) return { word: 'Noch vage', tone: 'low' };
  if (score <= 3) return { word: 'Auf dem Weg', tone: 'mid' };
  return { word: 'Präzise', tone: 'high' };
}

// „Stimmung fehlt: Beschreibe …“ → „Beschreibe …“ (der Name steht schon daneben)
const adviceOf = (hint) => {
  const i = hint.indexOf(': ');
  return i >= 0 ? hint.slice(i + 2) : hint;
};

// Hinweise aus result.missing den Bausteinen zuordnen (gleiche Reihenfolge wie BLOCKS)
function hintsFor(result) {
  const map = {};
  let i = 0;
  BLOCKS.forEach((b) => { if (!result.found[b.key]) { map[b.key] = result.missing[i] || ''; i += 1; } });
  return map;
}

function missingNames(result) {
  return BLOCKS.filter((b) => !result.found[b.key]).map((b) => b.name);
}

function announceText(result) {
  if (result.empty) return 'Noch kein Prompt.';
  const miss = missingNames(result);
  return `${result.score} von 5 Bausteinen, ${band(result.score).word}.${miss.length ? ` Fehlt: ${miss.join(', ')}.` : ''}`;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Text mit [Platzhaltern]: die Lücken werden markiert, alles per textContent.
function fillWithGaps(node, text) {
  node.replaceChildren();
  text.split(/(\[[^\]]*\])/).forEach((piece) => {
    if (!piece) return;
    if (piece.startsWith('[') && piece.endsWith(']')) node.append(el('mark', 'gap', piece));
    else node.append(document.createTextNode(piece));
  });
}

// Plakat-Zähler: große Zahl, Stempel, fünf Balken
function createScore(compact = false) {
  const root = el('div', compact ? 'score score--compact' : 'score');
  const top = el('div', 'score__top');
  top.append(el('p', 'score__label label', 'Bausteine erkannt'));
  const num = el('p', 'score__num');
  const n = el('span', 'score__n', '0');
  num.append(n, el('span', 'score__of', '/5'));
  const stamp = el('p', 'score__stamp');
  const bar = el('ol', 'score__bar');
  bar.setAttribute('aria-hidden', 'true');
  const segs = BLOCKS.map(() => { const s = el('li'); bar.append(s); return s; });
  root.append(top, num, stamp, bar);

  let last = null;
  return {
    root,
    update(result) {
      const b = band(result.score);
      n.textContent = String(result.score);
      num.setAttribute('aria-label', `${result.score} von 5`);
      stamp.textContent = b.word;
      root.dataset.tone = b.tone;
      segs.forEach((s, i) => s.classList.toggle('is-on', i < result.score));
      if (last !== null && last !== result.score && !reduceMotion.matches) {
        root.classList.remove('is-bump');
        void root.offsetWidth;
        root.classList.add('is-bump');
      }
      last = result.score;
    },
    reset() { last = null; },
  };
}

// Prüf-Tafel: Zähler + fünf Bausteine (+ optional präzisere Version)
function createCheck({ withImproved = false } = {}) {
  const root = el('div', 'check');

  const empty = el('div', 'check__empty');
  empty.append(
    el('p', 'check__empty-big', 'Schreib erst etwas …'),
    el('p', 'check__empty-small', 'Sobald dein Prompt dasteht, siehst du hier, welche der fünf Bausteine er schon hat und was noch fehlt.'),
  );

  const filled = el('div', 'check__filled');
  const score = createScore();

  const list = el('ol', 'blocks');
  list.setAttribute('aria-label', 'Die fünf Bausteine');
  const rows = BLOCKS.map((b, i) => {
    const li = el('li', 'block');
    const head = el('div', 'block__head');
    head.append(
      el('span', 'block__no', String(i + 1).padStart(2, '0')),
      el('span', 'block__name', b.name),
    );
    const state = el('span', 'block__state label');
    head.append(state);
    const hint = el('p', 'block__hint');
    li.append(head, hint);
    list.append(li);
    return { li, state, hint, key: b.key };
  });

  filled.append(score.root, list);

  let better = null;
  if (withImproved) {
    better = {
      wrap: el('div', 'better'),
      label: el('p', 'better__label label'),
      text: el('p', 'brick better__text'),
      btn: el('button', 'btn-copy', 'Kopieren'),
      status: el('span', 'copy-status'),
      value: '',
    };
    better.btn.type = 'button';
    better.status.setAttribute('role', 'status');
    const actions = el('div', 'better__actions');
    actions.append(better.btn, better.status);
    better.wrap.append(better.label, better.text, actions);
    bindCopy(better.btn, () => better.value, better.status);
    filled.append(better.wrap);
  }

  root.append(empty, filled);

  function render(result) {
    empty.hidden = !result.empty;
    filled.hidden = result.empty;
    if (result.empty) { score.reset(); return; }
    score.update(result);
    const hints = hintsFor(result);
    rows.forEach((r) => {
      const ok = result.found[r.key];
      r.li.dataset.state = ok ? 'found' : 'missing';
      r.state.textContent = ok ? 'erkannt' : 'fehlt';
      r.hint.textContent = ok ? '' : adviceOf(hints[r.key]);
      r.hint.hidden = ok;
    });
    if (better) {
      better.value = result.improved;
      const done = result.score === 5;
      better.label.textContent = done ? 'Alle fünf Bausteine drin, bereit zum Kopieren' : 'Präzisere Version: ersetze die Lücken';
      fillWithGaps(better.text, result.improved);
      better.btn.textContent = done ? 'Prompt kopieren' : 'Version kopieren';
      better.status.textContent = '';
    }
  }

  return { root, render };
}

function initWerkstatt() {
  const body = $('#werkstatt-body');
  if (!body) return;

  /* Modus-Reiter (Pfeiltasten wie bei echten Tabs) */
  const tabs = [...body.querySelectorAll('[role="tab"]')];
  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      $(`#${t.getAttribute('aria-controls')}`).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  initFreeMode();
  initExercises();
}

function initFreeMode() {
  const input = $('#frei-input');
  const out = $('#frei-out');
  const mini = $('#frei-mini');
  const live = $('#frei-live');
  const check = createCheck({ withImproved: true });
  out.append(check.root);

  let lastSaid = '';
  const announce = debounce((result) => {
    const text = announceText(result);
    if (text !== lastSaid) { live.textContent = text; lastSaid = text; }
  }, 900);

  function update() {
    const result = analyzePrompt(input.value);
    check.render(result);
    mini.hidden = result.empty;
    mini.textContent = result.empty ? '' : `${result.score}/5`;
    mini.dataset.tone = band(result.score).tone;
    announce(result);
  }

  input.addEventListener('input', update);
  document.querySelectorAll('#panel-frei [data-sample]').forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.sample;
      update();
      input.focus();
    });
  });
  update();
}

function initExercises() {
  const total = exercises.length;
  const nEl = $('#ex-n');
  const ofEl = $('#ex-of');
  const ticks = $('#ex-ticks');
  const solvedEl = $('#ex-solved');
  const vageEl = $('#ex-vage');
  const hintEl = $('#ex-hint');
  const input = $('#ex-input');
  const out = $('#ex-out');
  const live = $('#ex-live');
  const solutionBtn = $('#ex-solution');
  const muster = $('#ex-muster');
  const musterText = $('#ex-muster-text');
  const musterStatus = $('#ex-muster-status');
  const musterScore = createScore(true);
  $('#ex-muster-score').append(musterScore.root);
  $('#ex-count').textContent = String(total);
  ofEl.textContent = `/${total}`;

  const check = createCheck();
  out.append(check.root);
  out.hidden = true;

  const best = new Array(total).fill(-1);   // beste Wertung je Übung (nur im Speicher)
  const drafts = new Array(total).fill(''); // Entwürfe je Übung
  const tickEls = exercises.map(() => { const li = el('li'); ticks.append(li); return li; });

  let index = 0;
  let rated = false;  // nach dem ersten „Bewerten“ läuft die Wertung live mit

  function paintTicks() {
    tickEls.forEach((t, i) => {
      t.classList.toggle('is-current', i === index);
      t.classList.toggle('is-solved', best[i] >= 4);
    });
    const solved = best.filter((s) => s >= 4).length;
    solvedEl.textContent = solved ? `${solved} von ${total} präzise gelöst` : 'Ziel: 4 von 5 Bausteinen';
  }

  function rate(say) {
    const result = analyzePrompt(input.value);
    out.hidden = false;
    check.render(result);
    if (!result.empty) best[index] = Math.max(best[index], result.score);
    paintTicks();
    if (say) live.textContent = announceText(result);
    return result;
  }
  const rateQuietly = debounce(() => rate(false), 250);
  const sayLater = debounce(() => {
    const text = announceText(analyzePrompt(input.value));
    if (text !== live.textContent) live.textContent = text;
  }, 1000);

  function setSolution(open) {
    muster.hidden = !open;
    solutionBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    solutionBtn.textContent = open ? 'Musterlösung verbergen' : 'Musterlösung zeigen';
  }

  function show(i, say) {
    drafts[index] = input.value;
    index = (i + total) % total;
    const ex = exercises[index];
    nEl.textContent = String(index + 1).padStart(2, '0');
    vageEl.textContent = `„${ex.vage}“`;
    hintEl.textContent = ex.hinweis;
    input.value = drafts[index];
    musterText.textContent = ex.muster;
    musterStatus.textContent = '';
    musterScore.reset();
    musterScore.update(analyzePrompt(ex.muster));
    setSolution(false);
    rated = false;
    out.hidden = true;
    paintTicks();
    if (say) live.textContent = `Übung ${index + 1} von ${total}: ${ex.vage}`;
  }

  // Auf schmalen Schirmen liegt das Ergebnis unter dem Textfeld: kurz hinscrollen.
  function reveal(node) {
    const r = node.getBoundingClientRect();
    if (r.top > window.innerHeight - 120 || r.bottom < 0) {
      node.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }
  function rateNow() { rated = true; rate(true); reveal(out); }

  $('#ex-check').addEventListener('click', rateNow);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); rateNow(); }
  });
  input.addEventListener('input', () => { if (rated) { rateQuietly(); sayLater(); } });
  solutionBtn.addEventListener('click', () => {
    const open = muster.hidden;
    setSolution(open);
    if (open) reveal(muster);
  });
  $('#ex-next').addEventListener('click', () => show(index + 1, true));
  bindCopy($('#ex-muster-copy'), () => musterText.textContent, musterStatus);

  show(0, false);
}

/* ───────── 03 · Inspiration ───────── */

const dirById = new Map(directions.map((d) => [d.id, d]));

// Mut-Stufen für Anzeige, Bildschirmleser und den kleinen Schubs Richtung mutig.
const MUT_LEVELS = [
  { max: 19, word: 'brav', nudge: 'Brav ist sicher. Und nach fünf Sekunden vergessen. Dreh weiter auf.' },
  { max: 44, word: 'eigen', nudge: 'Schon eigen. Aber da geht noch deutlich mehr.' },
  { max: 69, word: 'mutig', nudge: 'Jetzt wird es interessant. Noch ein Stück weiter?' },
  { max: 89, word: 'wild', nudge: 'So sieht keine Vorlage aus. Genau richtig.' },
  { max: 100, word: 'extrem', nudge: 'Maximal. Hier fängt Wiedererkennung an.' },
];
const mutLevel = (v) => MUT_LEVELS.find((l) => v <= l.max) || MUT_LEVELS[MUT_LEVELS.length - 1];

const SWATCH_ROLES = ['Grund', 'Text', 'Akzent', 'Akzent', 'Akzent'];
const FONT_ROLES = ['Überschrift', 'Fließtext', 'Ergänzung'];

// Schriften mit kräftigen Schnitten: dort fordern wir 400 und 800 an, sonst nur den Normalschnitt.
const BOLD_FONTS = new Set([
  'Archivo', 'Archivo Narrow', 'Space Grotesk', 'Jost', 'Josefin Sans', 'Playfair Display', 'Source Serif 4',
  'Syne', 'Unbounded', 'DM Sans', 'Orbitron', 'Baloo 2', 'Chakra Petch', 'IBM Plex Mono', 'Space Mono',
  'Courier Prime', 'Caveat',
]);

// Schriften erst laden, wenn eine Richtung sie zeigt. Jede Familie einzeln:
// fällt eine aus (offline, Tippfehler), bleiben die anderen und die Ersatzschrift greift.
const loadedFonts = new Set();
function loadFont(family) {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const axis = BOLD_FONTS.has(family) ? ':wght@400;800' : '';
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}${axis}&display=swap`;
  link.addEventListener('error', () => { link.remove(); });
  document.head.append(link);
}

// Helligkeit nach WCAG, um auf jeder Farbe lesbaren Text zu wählen.
function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  return [16, 8, 0]
    .map((shift) => ((n >> shift) & 255) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}
const textOn = (hex) => (luminance(hex) > 0.22 ? '#16130f' : '#f6f0e2');
const fontStack = (family) => `"${family}", var(--f-text)`;

function newSeed() {
  if (window.crypto && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 2 ** 32);
}

// Einheitliche Ansicht für eine einzelne Richtung und für eine Mischung.
function viewOfDirection(d) {
  return {
    key: d.id,
    art: d.id,
    kind: `Richtung ${String(directions.indexOf(d) + 1).padStart(2, '0')} von ${directions.length}`,
    mut: String(d.mut),
    name: d.name,
    desc: d.beschreibung,
    farben: d.farben,
    schriften: d.schriften,
    layout: d.layout,
    bewegung: d.bewegung,
    prompt: d.prompt,
  };
}

function viewOfMix(mix) {
  const [a, b] = mix.quellen.map((id) => dirById.get(id));
  return {
    key: mix.quellen.join('+'),
    art: a.id,
    kind: 'Mischung aus zwei Richtungen',
    mut: 'Mix',
    name: `${a.name} × ${b.name}`,
    desc: `Farben und Layout aus „${a.name}“, Schrift und Bewegung aus „${b.name}“. Zwei Welten, die sich normalerweise nie begegnen.`,
    farben: mix.farben,
    schriften: [mix.schrift],
    layout: mix.layout,
    bewegung: mix.bewegung,
    prompt: mix.prompt,
  };
}

function initInspiration() {
  const body = $('#inspiration-body');
  if (!body) return;
  const range = $('#mut');
  const num = $('#mut-num');
  const word = $('#mut-word');
  const nudge = $('#mut-nudge');
  const live = $('#insp-live');
  const card = $('#dir');
  const spec = $('#spec');
  const promptEl = $('#dir-prompt');
  const statusEl = $('#dir-status');

  let seed = newSeed();
  let current = null;

  function readDial() {
    const v = Number(range.value);
    const level = mutLevel(v);
    num.textContent = String(v);
    word.textContent = level.word;
    nudge.textContent = level.nudge;
    range.setAttribute('aria-valuetext', `${v} von 100, ${level.word}`);
    range.style.setProperty('--fill', `${v}%`);
    body.dataset.level = level.word;
    return v;
  }

  function paintSwatches(farben) {
    const list = $('#dir-swatches');
    list.replaceChildren(...farben.map((hex, i) => {
      const li = el('li', 'swatch');
      li.style.setProperty('--sw', hex);
      li.style.setProperty('--sw-ink', textOn(hex));
      li.append(el('span', 'swatch__hex', hex.toUpperCase()), el('span', 'swatch__role', SWATCH_ROLES[i] || 'Akzent'));
      return li;
    }));
    list.dataset.count = String(farben.length);
  }

  function paintFonts(schriften) {
    const list = $('#dir-fonts');
    list.replaceChildren(...schriften.map((family, i) => {
      loadFont(family);
      const li = el('li', 'font');
      const name = el('span', 'font__name', family);
      name.style.fontFamily = fontStack(family);
      li.append(name, el('span', 'font__role label', schriften.length === 1 ? 'Für alles' : FONT_ROLES[i] || 'Ergänzung'));
      return li;
    }));
  }

  function paintSpecimen(view) {
    const [c0, c1, c2, c3 = c2, c4 = c3] = view.farben;
    const colors = { c0, c1, c2, c3, c4 };
    Object.entries(colors).forEach(([k, hex]) => {
      spec.style.setProperty(`--${k}`, hex);
      spec.style.setProperty(`--${k}-ink`, textOn(hex));
    });
    const head = view.schriften[0];
    const text = view.schriften[1] || head;
    spec.style.setProperty('--fa', fontStack(head));
    spec.style.setProperty('--fb', fontStack(text));
    spec.style.setProperty('--wa', BOLD_FONTS.has(head) ? '800' : '400');
    spec.dataset.art = view.art;
    $('#spec-cap').textContent = `Vorschau: die Bäckerei aus dem Atlas, gesetzt in ${head} mit dieser Palette`;
  }

  function render(view, say) {
    current = view;
    $('#dir-kind').textContent = view.kind;
    $('#dir-mut').textContent = view.mut;
    $('#dir-name').textContent = view.name;
    $('#dir-desc').textContent = view.desc;
    $('#dir-layout').textContent = view.layout;
    $('#dir-motion').textContent = view.bewegung;
    promptEl.textContent = view.prompt;
    statusEl.textContent = '';
    card.dataset.mode = view.mut === 'Mix' ? 'mix' : 'single';
    paintSwatches(view.farben);
    paintFonts(view.schriften);
    paintSpecimen(view);
    if (!reduceMotion.matches) {
      card.classList.remove('is-new');
      void card.offsetWidth;
      card.classList.add('is-new');
    }
    if (say) live.textContent = say;
  }

  // Einzelne Richtung zum Regler; mit neuem Seed garantiert eine andere als die gezeigte.
  function showPick({ fresh = false, announce = false } = {}) {
    const v = readDial();
    let d = pickDirection(v, seed);
    for (let tries = 0; fresh && current && d.id === current.key && tries < 12; tries += 1) {
      seed = newSeed();
      d = pickDirection(v, seed);
    }
    if (!fresh && current && d.id === current.key) return;
    render(viewOfDirection(d), announce ? `Neue Richtung: ${d.name}, Mut ${d.mut} von 100.` : '');
  }

  function showMix() {
    let mix = mixDirections(seed);
    for (let tries = 0; current && mix.quellen.join('+') === current.key && tries < 12; tries += 1) {
      seed = newSeed();
      mix = mixDirections(seed);
    }
    const view = viewOfMix(mix);
    render(view, `Mischung: ${view.name}.`);
  }

  // Beim Ziehen nur die Anzeige sofort, die Karte erst nach kurzer Ruhe; keine Ansagen.
  const settle = debounce(() => showPick(), 220);
  range.addEventListener('input', () => { readDial(); settle(); });
  range.addEventListener('change', () => showPick());

  $('#insp-new').addEventListener('click', () => { seed = newSeed(); showPick({ fresh: true, announce: true }); });
  $('#insp-mix').addEventListener('click', () => { seed = newSeed(); showMix(); });
  bindCopy($('#dir-copy'), () => (current ? current.prompt : ''), statusEl);

  // Standard-Fallen: „Was: Warum“ getrennt setzen
  const list = $('#traps-list');
  traps.forEach((t, i) => {
    const cut = t.indexOf(': ');
    const what = cut >= 0 ? t.slice(0, cut) : t;
    const why = cut >= 0 ? t.slice(cut + 2) : '';
    const li = el('li', 'trap');
    li.append(el('span', 'trap__no', String(i + 1).padStart(2, '0')));
    const txt = el('div', 'trap__body');
    txt.append(el('p', 'trap__what', what));
    if (why) txt.append(el('p', 'trap__why', why));
    li.append(txt);
    list.append(li);
  });

  showPick({ fresh: true });
}

/* ───────── 04 · Skill-Guide ───────── */

// Skill-Namen im Fließtext als Code setzen, alles als Textknoten.
const skillPattern = new RegExp(
  `(${skills.map((s) => s.name).sort((a, b) => b.length - a.length).map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
);
function withSkillNames(node, text) {
  text.split(skillPattern).forEach((piece, i) => {
    if (!piece) return;
    node.append(i % 2 ? el('code', 'sk-code', piece) : document.createTextNode(piece));
  });
  return node;
}

// „website-design:landing-page“ darf nach dem Doppelpunkt umbrechen.
function skillName(node, name) {
  name.split(/(?<=:)/).forEach((part, i) => {
    if (i) node.append(document.createElement('wbr'));
    node.append(document.createTextNode(part));
  });
  return node;
}

function initSkills() {
  const list = $('#skills-list');
  const steps = $('#path-steps');
  if (!list || !steps) return;

  skills.forEach((s, i) => {
    const li = el('li', 'skill');
    li.append(el('span', 'skill__no', String(i + 1).padStart(2, '0')));

    const head = el('div', 'skill__head');
    head.append(skillName(el('h3', 'skill__name'), s.name));

    const why = el('dl', 'skill__why');
    [['Wann', s.wann], ['Warum', s.warum]].forEach(([k, v]) => {
      const row = el('div', 'skill__row');
      row.append(el('dt', 'label', k), el('dd', null, v));
      why.append(row);
    });
    head.append(why);

    const ex = el('div', 'skill__ex');
    ex.append(el('p', 'label skill__ex-label', 'Beispielprompt'), el('p', 'brick', s.beispielprompt));
    const btn = el('button', 'btn-copy', 'Kopieren');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Beispielprompt für ${s.name} kopieren`);
    const status = el('span', 'copy-status');
    status.setAttribute('role', 'status');
    const actions = el('div', 'skill__actions');
    actions.append(btn, status);
    ex.append(actions);
    bindCopy(btn, () => s.beispielprompt, status);

    li.append(head, ex);
    list.append(li);
  });

  workflow.forEach((w, i) => {
    const cut = w.indexOf(': ');
    const li = el('li', 'step');
    li.append(el('span', 'step__no', String(i + 1)));
    const txt = el('div', 'step__body');
    txt.append(el('h4', 'step__title', cut >= 0 ? w.slice(0, cut) : w));
    if (cut >= 0) txt.append(withSkillNames(el('p', 'step__text'), w.slice(cut + 2)));
    li.append(txt);
    steps.append(li);
  });
}

/* ───────── Start ───────── */

const inits = [initShell, initAtlas, initWerkstatt, initInspiration, initSkills];
inits.forEach((init) => init());
