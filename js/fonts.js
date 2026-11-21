// Google-Fonts-Abfragen für die Richtungs-Vorschau. DOM-frei, damit testbar.
// Nur Familien mit belegtem kräftigem Schnitt bekommen eine wght-Achse, und zwar
// genau mit dem stärksten Schnitt, den die Familie bei Google Fonts wirklich hat
// (geprüft per Anfrage an fonts.googleapis.com/css2, November 2026).
// Alle anderen werden ohne Achse geladen (Normalschnitt 400).

export const BOLD_WEIGHT = {
  'Archivo': 800,
  'Jost': 800,
  'Playfair Display': 800,
  'Source Serif 4': 800,
  'Syne': 800,
  'Unbounded': 800,
  'DM Sans': 800,
  'Orbitron': 800,
  'Baloo 2': 800,
  'Archivo Narrow': 700,
  'Space Grotesk': 700,
  'Josefin Sans': 700,
  'Chakra Petch': 700,
  'IBM Plex Mono': 700,
  'Space Mono': 700,
  'Courier Prime': 700,
  'Caveat': 700,
};

// Gewicht für die Vorschau-Überschrift: nie mehr, als geladen wird.
export function headWeight(family) {
  return BOLD_WEIGHT[family] || 400;
}

// css2-Abfrage, z. B. "family=Space+Mono:wght@400;700&display=swap"
export function fontQuery(family) {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  const bold = BOLD_WEIGHT[family];
  return `family=${name}${bold ? `:wght@400;${bold}` : ''}&display=swap`;
}
