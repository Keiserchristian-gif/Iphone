// Regelbasierte Prompt-Prüfung (offline, ohne DOM/Node-APIs).

const LISTS = {
  element: [
    'hero', 'überschrift', 'ueberschrift', 'heading', 'headline', 'titel', 'title', 'header', 'navbar', 'navigation',
    'nav', 'menü', 'menue', 'menu', 'button', 'knopf', 'footer', 'fußzeile', 'fusszeile', 'section', 'abschnitt',
    'bild', 'image', 'foto', 'logo', 'karte', 'card', 'formular', 'form', 'text', 'absatz', 'paragraph', 'link',
    'liste', 'sidebar', 'banner', 'icon', 'galerie', 'gallery', 'tabelle', 'hintergrund', 'background',
  ],
  property: [
    'größe', 'groesse', 'grösse', 'grosse', 'size', 'bigger', 'smaller', 'größer', 'groesser', 'grösser', 'kleiner',
    'farbe', 'color', 'colour', 'schrift', 'font', 'typo', 'abstand', 'spacing', 'margin', 'padding', 'rand',
    'border', 'rahmen', 'schatten', 'shadow', 'animation', 'radius', 'rundung', 'breite', 'width', 'höhe', 'hoehe',
    'height', 'ausrichtung', 'align', 'kontrast', 'contrast', 'deckkraft', 'opacity', 'gewicht', 'weight', 'zeilenhöhe',
  ],
  mood: [
    'wirkt', 'wirken', 'stil', 'style', 'look', 'feel', 'poster', 'retro', 'minimal', 'brutalis', 'elegant',
    'verspielt', 'seriös', 'serioes', 'modern', 'futuristisch', 'editorial', 'zeitung', 'magazin', 'luxus', 'luxury',
    'playful', 'bold', 'mutig', 'ruhig', 'edgy', 'vintage', 'stimmung', 'atmosphäre', 'atmosphaere', 'vibe', 'like a',
    'wie ein',
  ],
  limit: [
    'nichts anderes', 'nichts weiter', 'nur', 'ohne', 'sonst nichts', 'keine anderen', 'alles andere', 'unverändert',
    'unveraendert', 'nicht ändern', 'nicht aendern', 'nicht anfassen', 'only', 'without', 'do not', "don't", 'leave the rest',
    'keep the rest', 'nothing else',
  ],
};

// Kurze Wörter nur als ganzes Wort treffen, um Fehltreffer zu vermeiden.
const WORD_ONLY = new Set(['nur', 'ohne', 'nav', 'form', 'rand', 'only', 'look', 'feel', 'like a', 'wie ein', 'bild', 'text', 'link', 'icon', 'card', 'logo', 'font', 'size', 'style', 'stil', 'title', 'menu', 'hero']);

const COLOR_NAMES = [
  'rot', 'blau', 'grün', 'gruen', 'gelb', 'schwarz', 'weiß', 'weiss', 'grau', 'orange', 'lila', 'violett', 'rosa',
  'pink', 'türkis', 'tuerkis', 'braun', 'beige', 'gold', 'silber', 'red', 'blue', 'green', 'yellow', 'black', 'white',
  'gray', 'grey', 'purple', 'brown', 'cyan', 'serif', 'sans-serif', 'monospace', 'fett', 'bold', 'kursiv', 'italic',
];

const VALUE_PATTERNS = [
  /#[0-9a-f]{3,8}\b/,
  /\b\d+(?:[.,]\d+)?\s?(?:px|rem|em|vh|vw|%|pt|ms|s|deg)(?![a-zäöüß])/,
  /\b(?:rgb|rgba|hsl|hsla)\s*\(/,
  /\b\d+(?:[.,]\d+)?\b/,
];

const HINTS = {
  element: 'Element fehlt: Sag, welcher Teil der Seite gemeint ist (z. B. Hero, Überschrift, Navbar, Button).',
  property: 'Eigenschaft fehlt: Sag, was sich ändern soll (z. B. Größe, Farbe, Schrift, Abstand, Schatten).',
  value: 'Konkreter Wert fehlt: Nenne eine Zahl mit Einheit, einen Hex-Farbcode oder einen Farbnamen (z. B. 96px, #111).',
  mood: 'Stimmung fehlt: Beschreibe, wie es wirken soll (z. B. wie ein Zeitungs-Poster, retro, minimalistisch).',
  limit: 'Grenze fehlt: Sag, was unverändert bleiben soll (z. B. „nichts anderes anfassen“).',
};

const PLACEHOLDERS = {
  element: '[Element, z. B. Überschrift im Hero]',
  property: '[Eigenschaft, z. B. Größe / Farbe / Schrift]',
  value: '[konkreter Wert, z. B. 96px / #111]',
  mood: '[Stimmung, z. B. wirkt wie ein Zeitungs-Poster]',
  limit: '[Grenze, z. B. nichts anderes anfassen]',
};

const KEYS = ['element', 'property', 'value', 'mood', 'limit'];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeyword(text, kw) {
  if (WORD_ONLY.has(kw)) {
    return new RegExp(`(^|[^a-zäöüß])${escapeRe(kw)}($|[^a-zäöüß])`).test(text);
  }
  return text.includes(kw);
}

function detect(key, text) {
  if (key === 'value') {
    if (VALUE_PATTERNS.some((re) => re.test(text))) return true;
    return COLOR_NAMES.some((c) => new RegExp(`(^|[^a-zäöüß])${escapeRe(c)}($|[^a-zäöüß])`).test(text));
  }
  return LISTS[key].some((kw) => hasKeyword(text, kw));
}

export function analyzePrompt(input) {
  const raw = typeof input === 'string' ? input : '';
  const text = raw.trim().toLowerCase();
  const found = { element: false, property: false, value: false, mood: false, limit: false };

  if (text === '') {
    return {
      empty: true,
      found,
      missing: KEYS.map((k) => HINTS[k]),
      score: 0,
      improved: KEYS.map((k) => PLACEHOLDERS[k]).join(', '),
    };
  }

  for (const k of KEYS) found[k] = detect(k, text);
  const missing = KEYS.filter((k) => !found[k]).map((k) => HINTS[k]);
  const score = KEYS.filter((k) => found[k]).length;

  const parts = [raw.trim().replace(/[.!?\s]+$/, '')];
  for (const k of KEYS) if (!found[k]) parts.push(PLACEHOLDERS[k]);
  const improved = score === 5 ? raw.trim() : parts.join(', ');

  return { empty: false, found, missing, score, improved };
}
