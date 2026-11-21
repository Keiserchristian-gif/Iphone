# Lebensgalaxie Implementation Plan

**Goal:** iPhone app that shows a life as a 3D galaxy (course) and solar system (current state), fed by day notes, a questionnaire and document import, fully on device.

**Architecture:** Native SwiftUI shell. Pure logic in the local Swift package `LebensKern` (no Apple frameworks, tested on Linux and in CI). The 3D scene is a bundled three.js page in a WKWebView with all network loads blocked. One AES-GCM encrypted JSON store, key in the Keychain behind Face ID.

**Tech Stack:** Swift 6 toolchain (language mode 5), SwiftUI, CryptoKit, LocalAuthentication, FoundationModels, PDFKit, Vision, WebKit, three.js r128. iOS 26.0 deployment target. No third-party Swift dependencies.

**Spec:** `docs/superpowers/specs/2026-11-21-lebensgalaxie-design.md`

## Global Constraints

- No network access anywhere. No analytics, no remote fonts or scripts.
- All UI copy in German, informal "du", no reproaches for skipped days.
- Life areas are fixed: menschen, arbeit, gesundheit, geld, traeume.
- Bundle id `de.lebensgalaxie.app`, product name `Lebensgalaxie`.
- Demo mode (`-demo` launch argument, DEBUG only) skips the lock and uses the invented example life. Real data never appears in the repo.

## Review Focus

1. Empty life (no events, no birth date yet): scene and overview text must still work.
2. Day closed twice or with zero notes: second close replaces the first, never duplicates.
3. Notes left over from earlier days: become days without mood, silently.
4. Questionnaire answer edited later: derived events, moons and phases are replaced, not duplicated.
5. Garbage or huge document text: station detection returns nothing or a bounded list, never crashes.

## File Structure

```
Lebensgalaxie.xcodeproj/                 project (synchronized folder group) + shared scheme
Lebensgalaxie/
  App/LebensgalaxieApp.swift             @main, scene phase, root routing
  App/AppModel.swift                     @Observable state: lock, Bestand, save, AI
  Sicherheit/Tresor.swift                Keychain key, AES-GCM file read/write
  Sicherheit/Sicherung.swift             password backup export/import
  KI/Auswertung.swift                    FoundationModels + keyword fallback
  Import/Texterkennung.swift             PDFKit + Vision OCR
  Welt/WeltView.swift                    main screen with overlays
  Welt/SzeneWebView.swift                WKWebView bridge
  Tag/TagesabschlussView.swift, Tag/TagebuchView.swift
  Fragebogen/FragebogenView.swift
  Dokumente/DokumenteView.swift
  Phasen/PhasenView.swift
  Einstellungen/EinstellungenView.swift
  Start/SperrView.swift, Start/ErsterStartView.swift
  Gestaltung/Stil.swift                  colours and shared styles
  Szene/szene.html, szene.js, three.min.js
  Assets.xcassets
Packages/LebensKern/
  Sources/LebensKern/Modell.swift        data types
  Sources/LebensKern/Zeit.swift          age and date helpers
  Sources/LebensKern/Bestand+Tag.swift   notes, closing a day, cleanup
  Sources/LebensKern/Fragebogen.swift    question types, applying answers
  Sources/LebensKern/FragebogenInhalt.swift  the chapters and questions
  Sources/LebensKern/Zuordnung.swift     keyword classifier, short summary
  Sources/LebensKern/Stationen.swift     year/range detection in document text
  Sources/LebensKern/Szenendaten.swift   Bestand -> scene JSON
  Sources/LebensKern/Ueberblick.swift    overview sentences, durations
  Sources/LebensKern/Beispiel.swift      invented example life
  Tests/LebensKernTests/*.swift
.github/workflows/ios.yml                package tests, simulator build, screenshots
```

## Interfaces

**LebensKern**

- `enum Bereich: String, Codable, CaseIterable` with `titel`.
- `struct Bestand: Codable` holding `profil`, `ereignisse`, `notizen` (open), `tage`, `phasen`, `monde`, `antworten`, `dokumente`.
- `Bestand.notiere(_:am:)`, `Bestand.schliesseTag(am:text:stimmung:bereiche:kurz:kalender:) -> Tag`, `Bestand.raeumeAuf(heute:kalender:)`, `Bestand.notizen(am:kalender:)`, `Bestand.tag(am:kalender:)`.
- `Bestand.uebernehme(_ antwort: Antwort, fuer frage: Frage, heute:)` replaces everything derived from that question.
- `Zuordnung.bereiche(fuer:) -> [Bereich]`, `Zuordnung.kurzfassung(_:max:) -> String`.
- `Stationen.erkenne(in:heute:) -> [Station]`, `Stationen.stuecke(_:laenge:) -> [String]`.
- `Szenenbau.baue(_:heute:kalender:) -> Szene` (Codable, sent to the web scene as JSON).
- `Ueberblick.text(_:heute:) -> String`, `Ueberblick.dauer(von:bis:) -> String`.

**Web scene (`window.Szene`)**

- Native to scene: `setze(daten)`, `modus('galaxie'|'system')`, `funke()`, `verschmelze()`, `zeit(t|null)`, `raender(oben, unten)`.
- Scene to native via `webkit.messageHandlers.app`: `{typ:'bereit'}`, `{typ:'wahl', art, id}`, `{typ:'haptik', art}`.
- Opened without a native host it loads the example life, so it can be checked in a desktop browser.

## Tasks

1. **LebensKern** with tests: model, time, day closing, questionnaire application, classifier, station detection, scene data, overview. Verify with `swift test`.
2. **Scene**: galaxy from the prototype driven by data, solar system, mode transition, spark and merge animations. Verify by screenshots in headless Chromium.
3. **Security**: Tresor, lock flow, privacy cover, backup.
4. **World screen**: web view bridge, note field, day closing sheet, detail card, time travel.
5. **Questionnaire** screens over `FragebogenInhalt`.
6. **Documents**: import, OCR, station review. **AI**: FoundationModels wrappers with fallback.
7. **Diary, phases, settings.**
8. **Project and CI**: pbxproj, scheme, workflow. Verify by a green simulator build and screenshots.
9. **README** with install steps for a non-developer.
