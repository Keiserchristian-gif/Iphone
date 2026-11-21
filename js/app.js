// Design-Trainer · Oberfläche. Jeder Bereich hat seine eigene init-Funktion.
import { vocab } from './data/vocab.js';

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

/* ───────── Start ───────── */

// Spätere Bereiche hängen sich hier an (initWerkstatt, initInspiration, initSkills).
const inits = [initShell, initAtlas];
inits.forEach((init) => init());
