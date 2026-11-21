# Design-Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deutschsprachige Web-App (Etappe 1), die Website-Vokabular, präzises Prompten, mutige Gegenrichtungen zum Standard und Skill-Wahl trainiert.

**Architecture:** Statische Seite ohne Build. Reine Logik (Prompt-Prüfung, Richtungs-Generator) liegt in ES-Modulen ohne DOM und wird mit `node --test` getestet. Inhalte liegen als Datenmodule getrennt von der UI. `app.js` verdrahtet nur DOM.

**Tech Stack:** HTML, CSS, Vanilla JS (ES-Module), `node:test`, Playwright (vorinstalliert) nur für Sichtprüfung.

**Spec:** `docs/superpowers/specs/2026-11-21-design-trainer-design.md`

## Global Constraints

- Sprache aller sichtbaren Texte: Deutsch.
- Kein Build-Schritt, keine Laufzeit-Abhängigkeiten außer Google Fonts (mit Fallback-Schriften).
- Mobil nutzbar: kein horizontales Scrollen bei 390px Breite.
- Trainer-Look: Editorial/Poster (Riesenschrift, harter Kontrast, ungewohntes Raster) – kein Inter, kein Lila-Verlauf, keine Drei-Karten-Reihe, kein Glas-Look.
- Prompt-Prüfung läuft offline per Regeln, keine KI/Netzwerk.
- ~25 Vokabeln, 10 Übungen, ~12 Richtungen, 5 Skills (`frontend-design`, `website-design:design-system`, `website-design:landing-page`, `website-design:web-review`, `superdesign`).

## Review Focus

- Leerer / nur aus Leerzeichen bestehender Prompt → Hinweis statt Absturz oder Fantasie-Ergebnis.
- Englischer oder gemischter Prompt („make the hero bigger") → Bausteine werden trotzdem erkannt.
- Umlaute/Großschreibung („ÜBERSCHRIFT", „Größe") → werden erkannt.
- Mut-Regler an den Extremen (0 und 100) und gleicher Seed → immer gültige, reproduzierbare Richtung.
- Kopieren-Button ohne Clipboard-API (file://, ältere Browser) → Fallback, kein stummer Fehler.

---

### Task 1: Projektgerüst + Prompt-Prüfung

**Files:**
- Create: `package.json` (`"type":"module"`, script `"test": "node --test tests/"`), `js/prompt-check.js`, `tests/prompt-check.test.js`

**Interfaces:**
- Produces: `analyzePrompt(text: string): { empty: boolean, found: Record<'element'|'property'|'value'|'mood'|'limit', boolean>, missing: string[], score: number /*0-5*/, improved: string }`
  - `missing` enthält deutsche Hinweise je fehlendem Baustein; `improved` ist ein Prompt-Gerüst mit Platzhaltern in `[eckigen Klammern]`.

- [ ] **Step 1: Failing tests** in `tests/prompt-check.test.js`:
  - `analyzePrompt("")` und `analyzePrompt("   ")` → `empty === true`, `score === 0`.
  - `"mach das cooler"` → `score <= 1`, `missing.length >= 4`.
  - `"Ändere die Überschrift im Hero auf 96px, Schrift Serif, Farbe #111, wirkt wie ein Zeitungs-Poster, nichts anderes anfassen"` → alle fünf `found.*` true, `score === 5`.
  - `"make the hero heading bigger"` → `found.element === true`, `found.property === true`.
  - `"ÜBERSCHRIFT größe"` → `found.element` und `found.property` true.
- [ ] **Step 2:** `npm test` → FAIL (Modul fehlt).
- [ ] **Step 3: Implement** `analyzePrompt` in `js/prompt-check.js`: Schlüsselwortlisten je Baustein (Element: hero, überschrift, header, navbar, button, footer, section, bild …; Eigenschaft: größe, farbe, schrift, abstand, padding, rand, schatten, animation …; Wert: Zahl+Einheit, `#hex`, Farbnamen; Stimmung: wirkt, Stil, Look, Poster, retro …; Grenze: „nichts anderes", „nur", „ohne" …). Normalisieren per `toLowerCase()`; Treffer per `includes`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: prompt analysis logic`.

### Task 2: Richtungs-Generator + Richtungen-Daten

**Files:**
- Create: `js/data/directions.js`, `js/generator.js`, `tests/generator.test.js`

**Interfaces:**
- Produces: `directions: Direction[]` mit `Direction = { id, name, mut: number /*0-100*/, beschreibung, farben: string[] /*hex, 3-5*/, schriften: string[], layout: string, bewegung: string, prompt: string }`; `traps: string[]` (Standard-Fallen, ≥8).
- Produces: `pickDirection(mut: number, seed: number): Direction` – wählt aus Richtungen mit `|d.mut - mut| <= 25` (Fallback: nächstliegende), deterministisch nach `seed`; `mixDirections(seed: number): { farben, schrift, layout, bewegung, prompt }` kombiniert Teile zweier Richtungen.

- [ ] **Step 1: Failing tests:** (a) `directions.length >= 12` und jede hat alle Felder, `farben.length` 3–5, Hex-Format; (b) `pickDirection(100, 7)` hat `mut >= 75`; `pickDirection(0, 7)` hat `mut <= 25`; (c) gleicher Seed → gleiche `id`; (d) `mut` außerhalb 0–100 (−5, 500) wirft nicht und liefert eine Richtung; (e) `traps.length >= 8`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implement** Daten (12 Richtungen u. a. Brutalismus, Editorial-Zeitung, Retro-Terminal, Risograph, Swiss-Poster, Y2K, Bauhaus, Zine-Collage, Neon-Nacht, Papier & Stempel, Weltraum-Analog, Kinderbuch-Collage; Prompts so geschrieben, dass sie Element/Eigenschaft/Wert/Stimmung/Grenze enthalten) und Generator (seeded PRNG wie mulberry32, `mut` per clamp).
- [ ] **Step 4:** PASS. **Step 5:** Commit `feat: directions data and generator`.

### Task 3: Vokabeln, Übungen, Skills (Daten)

**Files:**
- Create: `js/data/vocab.js`, `js/data/exercises.js`, `js/data/skills.js`, `tests/data.test.js`

**Interfaces:**
- Produces: `vocab: { id, begriff, gruppe: 'Layout'|'Typografie'|'Farbe'|'Abstand'|'Interaktion'|'Bewegung', erklaerung, promptBaustein }[]` (≥25); `exercises: { id, vage, hinweis, muster }[]` (10; `muster` erreicht in `analyzePrompt` `score >= 4`); `skills: { name, wann, warum, beispielprompt }[]` (5 laut Constraints) und `workflow: string[]` (Richtung wählen → Design-System festhalten → bauen → reviewen).

- [ ] **Step 1: Failing tests:** Längen, alle Pflichtfelder nicht leer, IDs eindeutig, alle 6 Gruppen vertreten, jedes `exercises[i].muster` hat `analyzePrompt(...).score >= 4`, Skill-Namen exakt die fünf aus den Constraints.
- [ ] **Step 2:** FAIL. **Step 3:** Inhalte schreiben (verständliches Deutsch, ein Satz pro Erklärung). **Step 4:** PASS. **Step 5:** Commit `feat: vocab, exercises, skills content`.

### Task 4: Look, Shell und Vokabel-Atlas

**Files:**
- Create: `index.html`, `css/style.css`, `js/app.js`

**Interfaces:**
- Consumes: `vocab` (Task 3).
- Produces: Navigation mit vier Bereichen (`#atlas`, `#werkstatt`, `#inspiration`, `#skills`), Funktion `copyText(text: string): Promise<boolean>` in `js/app.js` (Clipboard-API, Fallback über temporäres `<textarea>` + `execCommand('copy')`, sonst `false`, UI zeigt dann „Bitte manuell kopieren").

- [ ] **Step 1:** `index.html` mit Poster-Layout (Riesenüberschrift, asymmetrisches Raster, begrenzte Palette, Display-Schrift mit Fallback), Navigation, vier `<section>`.
- [ ] **Step 2:** Atlas: Beispiel-Seite als Wireframe aus Blöcken; Tap/Hover auf ein Teil zeigt Begriff, Erklärung und kopierbaren Baustein; darunter filterbare Gesamtliste nach Gruppe.
- [ ] **Step 3:** Prüfen: `python3 -m http.server` + Playwright-Screenshot bei 390px und 1280px; keine horizontale Scrollbar (`document.documentElement.scrollWidth <= innerWidth`), Antippen eines Teils zeigt Detail.
- [ ] **Step 4:** Commit `feat: shell, look and vocabulary atlas`.

### Task 5: Prompt-Werkstatt

**Files:** Modify `index.html`, `css/style.css`, `js/app.js`

**Interfaces:** Consumes `analyzePrompt`, `exercises`, `copyText`.

- [ ] **Step 1:** Textfeld + Live-Anzeige der fünf Bausteine (erkannt/fehlt, Score x/5), `improved` mit Kopieren-Button; leerer Prompt zeigt Hinweis „Schreib erst etwas".
- [ ] **Step 2:** Übungsmodus: zeigt `vage` + `hinweis`, Nutzer schreibt Version, Bewertung per Score, Knopf „Musterlösung zeigen".
- [ ] **Step 3:** Prüfen per Playwright: Eingabe „mach das cooler" → Score ≤1 sichtbar; Musterlösung einer Übung → Score ≥4 sichtbar.
- [ ] **Step 4:** Commit `feat: prompt workshop`.

### Task 6: Inspirations-Generator + Skill-Guide

**Files:** Modify `index.html`, `css/style.css`, `js/app.js`

**Interfaces:** Consumes `pickDirection`, `mixDirections`, `traps`, `skills`, `workflow`, `copyText`.

- [ ] **Step 1:** Mut-Regler (0–100) + Knopf „Neue Richtung" (neuer Seed) + „Mischen"; Karte zeigt Farben (Farbfelder), Schriften, Layout, Bewegung, Prompt mit Kopieren; Liste „Standard-Fallen" daneben.
- [ ] **Step 2:** Skill-Guide: je Skill wann/warum/Beispielprompt (kopierbar) + Ablauf `workflow`.
- [ ] **Step 3:** Prüfen per Playwright: Regler auf 100 und 0 liefert jeweils eine Karte ohne Konsolenfehler; Skill-Guide zeigt 5 Einträge; Mobil 390px ohne horizontales Scrollen.
- [ ] **Step 4:** Commit `feat: inspiration generator and skill guide`.

### Task 7: Abschluss

**Files:** Modify `README.md`

- [ ] **Step 1:** README (Deutsch): Zweck, Start per `python3 -m http.server`, Tests per `npm test`, Hinweis auf Etappe 2.
- [ ] **Step 2:** `npm test` komplett grün; Konsole im Browser ohne Fehler.
- [ ] **Step 3:** Commit + Push auf `claude/jolly-babbage-17d9bd`.
