# Design-Trainer

Ein kleiner Trainer für Menschen, die keine Entwickler sind, aber mit Claude Code Websites bauen wollen. Er hilft dir dabei,

- die Teile einer Website **beim Namen zu nennen** (Fachbegriffe statt "dieses Ding da oben"),
- Claude Code **präzise zu briefen**, statt vage Wünsche zu äußern,
- **mutige, nicht-standardmäßige Designs** zu finden, statt bei der üblichen Karten-und-Verlauf-Seite zu landen.

Alles läuft offline im Browser, ohne Build-Schritt und ohne Abhängigkeiten.

## Die vier Bereiche

1. **Vokabel-Atlas** – Beispiel-Seite; Hover/Tap auf ein Teil zeigt Fachbegriff, Erklärung und einen Prompt-Baustein.
2. **Prompt-Werkstatt** – Prompt eingeben, fehlende Bausteine erkennen, präzisere Version erhalten; dazu Übungen "vage zu präzise".
3. **Inspirations-Generator** – Mut-Regler (brav bis extrem), Liste der Standard-Fallen und Gestaltungsrichtungen mit Farben, Schriften, Layoutregel, Bewegung und kopierbarem Prompt; auch als Zufallsmix.
4. **Skill-Guide** – Welcher vorhandene Claude-Skill wann hilft, mit Beispielprompt und empfohlenem Ablauf.

## Starten

```bash
python3 -m http.server 8000
```

Danach im Browser <http://localhost:8000> öffnen.

`index.html` per Doppelklick zu öffnen funktioniert nicht: Die App nutzt ES-Module (`import`), und Browser blockieren diese bei `file://`-Adressen. Ein lokaler Server löst das.

## Tests

```bash
npm test
```

Nutzt den eingebauten Node-Testrunner (`node --test`), keine Installation nötig. Geprüft werden Daten, Schriften, Generator und Prompt-Prüfung.

## Projektstruktur

```
index.html            Seite mit den vier Bereichen
css/style.css         Poster-Look
js/app.js             Einstieg, Oberfläche
js/generator.js       Inspirations-Generator (Logik)
js/prompt-check.js    Prompt-Prüfung (Schlüsselwort-Heuristik)
js/fonts.js           Schriften
js/data/              Inhalte: vocab, exercises, directions, skills
tests/                Tests (npm test)
docs/superpowers/     Spezifikation und Plan
```

## So übst du

Eine Routine für etwa 15 Minuten:

1. **Atlas (4 Min.)** – Fahre über die Beispiel-Seite und präge dir drei neue Begriffe ein.
2. **Werkstatt (5 Min.)** – Löse eine Übung, dann schreibe einen eigenen Prompt für dein aktuelles Projekt und schließe die gemeldeten Lücken.
3. **Inspiration (4 Min.)** – Stelle den Mut-Regler höher, als dir lieb ist, und würfle eine Richtung. Lies die Standard-Fallen, die du vermeiden willst.
4. **Skill-Guide (2 Min.)** – Wähle den Skill für den nächsten Schritt und kopiere den Beispielprompt in Claude Code.

## Ausblick: Etappe 2

Geplant ist ein `design-coach`-Skill für Claude Code (unter `.claude/skills/design-coach/`), der dieselben Inhalte nutzt: Er schärft Prompts, schlägt Gegenrichtungen vor und prüft auf Standard-Fallen. Er ist noch nicht gebaut.
