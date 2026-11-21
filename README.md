# Design-Trainer

Ein kleiner Trainer für Menschen, die keine Entwickler sind, aber mit Claude Code Websites bauen wollen. Er hilft dir dabei,

- die Teile einer Website **beim Namen zu nennen** (Fachbegriffe statt "dieses Ding da oben"),
- Claude Code **präzise zu briefen**, statt vage Wünsche zu äußern,
- **mutige, nicht-standardmäßige Designs** zu finden, statt bei der üblichen Karten-und-Verlauf-Seite zu landen.

Die Prompt-Prüfung und die gesamte Logik laufen offline im Browser, ohne Build-Schritt. Nur die Schriften kommen von Google Fonts (mit Ersatzschriften, falls sie nicht erreichbar sind).

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

## Der design-coach-Skill (Etappe 2)

Im Ordner `.claude/skills/design-coach/` liegt ein Skill für Claude Code. Er greift, wenn du ein Aussehen vage beschreibst („mach das cooler", „sieht langweilig aus", „nicht so Standard"):

1. Er spielt deinen Wunsch mit den richtigen Fachbegriffen zurück (Element, Eigenschaft, Wert, Stimmung, Grenze).
2. Ist die Richtung offen, bietet er drei Gegenrichtungen von vertraut bis extrem an und wartet auf deine Wahl.
3. Er baut nur das Gewünschte, prüft auf Standard-Fallen und nennt am Ende die gelernten Begriffe samt einem fertigen Prompt für nächstes Mal.

Ist dein Wunsch schon präzise, baut er sofort ohne Rückfragen.

Die Referenzdateien des Skills (`references/`) werden aus den Daten des Trainers erzeugt. Nach Änderungen an `js/data/` einmal `node scripts/build-skill-refs.mjs` ausführen; `npm test` meldet, wenn sie veraltet sind.

Zum Nutzen in einem anderen Projekt kopierst du den Ordner `.claude/skills/design-coach/` dorthin (oder in `~/.claude/skills/`, dann gilt er überall).
