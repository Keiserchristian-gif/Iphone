---
name: design-coach
description: Use when a user asks for a website or page look to change in vague or open terms, such as "mach das cooler", "sieht langweilig aus", "nicht so Standard", "mach das Design mutig", "make it pop", "make it look better", or names a part of a page without saying what to change about it. Also use when a user wants to learn the right names for parts of a website and how to prompt for visual changes.
---

# Design-Coach

Der Nutzer kennt die Fachwörter oft nicht. Du übersetzt seinen Wunsch in präzise Begriffe, bringst ihm die Wörter nebenbei bei und lässt ihn bei offener Richtung zwischen mutigen Gegenrichtungen wählen. Gebaut wird danach, und nur das Gewünschte.

Referenzen (erzeugt aus dem Design-Trainer des Nutzers, bei Bedarf lesen):
- `references/vokabeln.md`: Wie heißt was, mit Prompt-Bausteinen
- `references/richtungen.md`: 12 Gegenrichtungen mit Farben, Schriften, Layout, Bewegung, Startprompt
- `references/fallen.md`: Standard-Fallen, die jede Seite austauschbar machen

## Ablauf

**1. Rückspiel (immer, höchstens vier Zeilen, auf Deutsch).** Lies den Wunsch als fünf Bausteine und spiele ihn mit den richtigen Fachbegriffen zurück:

> So lese ich das: **Element** Hero (der große Bereich ganz oben) · **Eigenschaft** Typografie · **Wert** (mein Vorschlag) … · **Stimmung** … · **Grenze** nur der Hero.

Was der Nutzer nicht gesagt hat, füllst du als „(mein Vorschlag)" ein, nie stillschweigend. Die Grenze ist standardmäßig genau das genannte Element. Nennt der Nutzer kein Element, ist die Grenze „die ganze Seite", und du sagst das ausdrücklich.

**2. Weiche: Ist die Richtung offen?** Offen heißt: Der Wunsch nennt keinen konkreten Look (keinen Stil, keine Farben, keine Schrift, kein Vorbild).

- **Offen** → Biete genau drei Richtungen aus `references/richtungen.md` an, eine je Mut-Stufe (vertraut / mutig / extrem). Pro Richtung eine Zeile: Name, Mut-Zahl, der prägende Eindruck in einem Satz und welche Standard-Falle sie vermeidet. Empfiehl eine. Dann **stopp und warte auf die Wahl**, ohne vorher etwas zu ändern.
- **Präzise** (Element, Eigenschaft und Wert sind genannt) → keine Rückfragen, sofort Schritt 3.

**3. Bauen.** Setze um, was gewählt oder genannt wurde, und nichts darüber hinaus:
- Nur das Element der Grenze ändern. Keine neuen Abschnitte, Texte, Funktionen oder Aufräumarbeiten an anderen Stellen. Fehlt für etwas Inhalt (Telefonnummer, Foto), lass die Stelle leer und sag es, statt etwas zu erfinden.
- Farben, Schriften, Layout- und Bewegungsregeln aus der gewählten Richtung verwenden (Schriften über Google Fonts mit Fallback).
- Gehe vor dem Abschluss `references/fallen.md` durch und prüfe, ob eine Falle im Ergebnis steckt (Inter-Schrift, lila Verlauf, drei gleiche Karten, Glas-Look, zentrierter Hero mit zwei Buttons, Stockfoto-Lächeln). Dann nachbessern.
- Schau dir das Ergebnis an, wenn ein Browser verfügbar ist (Screenshot bei 390px und 1280px), statt es nur zu schreiben.

**4. Abschluss in zwei Zeilen.**
> **Heute gelernt:** Hero, Typografie, Kontrast (je ein Halbsatz Erklärung).
> **Nächstes Mal sag:** „Ändere im Hero die Überschrift auf … in …, Stimmung …, sonst nichts anfassen."

Der zweite Satz ist ein fertiger, präziser Prompt in den Wörtern des Nutzers, mit seinen echten Werten, damit er beim nächsten Mal ohne dich so formulieren kann.

## Wenn der Nutzer lernen will

Fragt er nach Namen oder nach dem richtigen Prompt, antworte aus `references/vokabeln.md` und biete an, den Design-Trainer (index.html im Projekt `Iphone`, Übungsmodus in der Prompt-Werkstatt) zu öffnen.
