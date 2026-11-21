# Design-Trainer – Design

## Absicht
Der Nutzer (Deutsch, kein Entwickler-Vokabular) will **spürbar präziser** Websites mit Claude Code verändern und **Inspiration für mutige, nicht-standardmäßige Designs** bekommen. Problem heute: Er kennt die Namen der Dinge (Hero, Padding, Eyebrow, Sticky …) nicht und kann deshalb nicht sagen, was er ändern will; Ergebnisse wirken generisch.

## Ziele
- Vokabular lernen: Teile einer Website benennen können.
- Prompts schärfen: vom vagen zum präzisen Prompt (Element → Eigenschaft → Wert → Stimmung → Grenze).
- Inspiration: mutige Gegenrichtungen zum Standard, mit kopierbaren Prompts.
- Skills verstehen: welcher Skill wann, warum.
- Der Trainer selbst sieht eigenwillig aus (er ist das Vorzeigestück).

## Nicht-Ziele
- Kein Website-Builder, kein Code-Editor, keine KI-Anbindung/Backend in Etappe 1.
- Keine Accounts, kein Tracking.

## Anti-Ziele (wäre ein Misserfolg)
- Sieht aus wie jede KI-/SaaS-Seite (Inter, Lila-Verlauf, drei Karten, Glas-Look).
- Er liest sich wie ein Glossar statt zu üben.
- Inspiration, die bei „modern, clean, minimalistisch" landet.

## Constraints
- Deutsch. Reine HTML/CSS/JS-Seite, kein Build-Schritt, ohne Abhängigkeiten außer evtl. Google Fonts. Läuft lokal und auf Vercel.
- Mobil nutzbar (Nutzer arbeitet u. a. am iPhone).
- Repo `Iphone` ist leer; Branch `claude/jolly-babbage-17d9bd`.

## Approaches
- **A) Nur Web-App:** anschaulich, aber getrennt vom Arbeitsort.
- **B) Nur Claude-Code-Skill:** am Arbeitsort, aber wenig sichtbar/lehrreich.
- **C) A + dünner Skill (gewählt, Empfehlung):** Web-App als Lernzentrum, danach ein kleiner `design-coach`-Skill aus denselben Inhalten. Der Nutzer wählte nicht ausdrücklich; die Empfehlung wurde mit seiner Aussage „ich gehe gerne in komplett andere Richtungen" bestätigt gelesen (meine Annahme, bitte prüfen).

## Etappe 1: Web-App (vier Bereiche)
1. **Vokabel-Atlas:** Eine Beispiel-Seite; Hover/Tap auf Teile zeigt Fachbegriff, Erklärung und Prompt-Satzbaustein. ~25 Begriffe (Layout, Typografie, Farbe, Abstand, Interaktion, Bewegung).
2. **Prompt-Werkstatt:** Eingabe eines Prompts → Prüfung auf fehlende Bausteine (Heuristik per Schlüsselwörter, offline) → präzise Version. Dazu 10 Übungen „vage → präzise" mit Musterlösung.
3. **Inspirations-Generator:** Mut-Regler (brav → extrem) + „Standard-Fallen"-Liste (was vermieden wird). ~12 Richtungen (z. B. Brutalismus, Editorial-Zeitung, Retro-Terminal, Risograph, Swiss-Poster, Y2K, Bauhaus, Zine-Collage …) mit Farben, Schriften, Layoutregel, Bewegung und kopierbarem Prompt. Zufallsmix möglich.
4. **Skill-Guide:** Vorhandene Skills (`frontend-design`, `website-design:design-system`, `website-design:landing-page`, `website-design:web-review`, `superdesign`) mit „wann / warum / Beispielprompt" und einem empfohlenen Ablauf (Richtung wählen → Design-System festhalten → bauen → reviewen).

**Look des Trainers:** eine mutige Richtung (Vorschlag: Editorial/Poster mit Riesenschrift, hartem Kontrast, ungewohntem Raster), nicht der Standard.

## Etappe 2: `design-coach`-Skill
Skill im Repo (`.claude/skills/design-coach/`), nutzt dieselben Inhalte: schärft Prompts, schlägt Gegenrichtungen vor, prüft auf Standard-Fallen. Eigene Freigabe vor dem Bau.

## Vom Nutzer entschieden
- Ziel/Why (spürbar präzise + mutige Inspiration), Gesamtidee, „komplett andere Richtungen als Standard".

## Meine Entscheidungen (bitte prüfen)
- Technik: statisches HTML/CSS/JS, Deutsch.
- Prompt-Prüfung per Regeln statt KI (läuft offline, kostenlos).
- Reihenfolge: erst Web-App, dann Skill.
- Look des Trainers: Editorial/Poster-Richtung.
- Skills werden erklärt, nicht neu installiert: die nötigen sind in dieser Umgebung schon vorhanden.

## Dem Builder überlassen
Exakte Begriffslisten, Farbwerte, Schriftwahl, Textinhalte der Übungen, Dateiaufteilung.
