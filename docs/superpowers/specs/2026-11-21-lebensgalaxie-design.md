# Lebensgalaxie: Entwurf

Stand: 21.11.2026. Im Gespräch abgestimmt und freigegeben.

## Wozu

Eine iPhone-App, die das eigene Leben von oben zeigt wie eine Spielwelt. Sie soll in Momenten helfen, die sich aussichtslos anfühlen: Man sieht, wo man gerade steht, was schon hinter einem liegt und dass frühere schwere Phasen wieder vorbeigegangen sind. Damit man gern jeden Tag hineinschaut und schreibt, muss sie sehr visuell sein und einen Wow-Effekt haben.

## Ziele

- Das ganze Leben auf einen Blick, als drehbare Galaxie. Innen die Geburt, außen heute, jede Umdrehung ein Jahrzehnt.
- Der jetzige Stand als Sonnensystem. Die Person ist die Sonne, jeder Lebensbereich ein Planet, wichtige Menschen und Vorhaben sind Monde.
- Schwere Phasen sind als Dunkelwolken sichtbar, mit Dauer, auch die vergangenen.
- Tagsüber kurze Notizen, abends ein Tagesabschluss. Die Notizen verschmelzen zu einem Stern.
- Ein ausführlicher Fragebogen füllt die Vergangenheit.
- Dokumente wie Lebensläufe lassen sich einlesen. Erkannte Stationen werden vor dem Eintragen einzeln bestätigt.
- Die App ordnet Einträge selbst den Lebensbereichen zu.

## Was es nicht ist

- Kein Konto, keine Cloud, kein Abgleich zwischen Geräten.
- Keine Therapie und keine Diagnose. Die App zeigt Verlauf, sie bewertet nicht.
- Keine Erinnerungen per Push in der ersten Fassung.

## Was ein Fehlschlag wäre

- Daten verlassen das Gerät.
- Die App wirkt wie eine Tabelle oder ein Formular statt wie eine Welt.
- Der Tagesabschluss dauert länger als zwei Minuten.
- Die App macht Vorwürfe, wenn man Tage auslässt.

## Rahmen

- iPhone 17 Pro Max, iOS 26 oder neuer. Installation über Xcode auf dem eigenen Mac.
- Alles läuft auf dem Gerät. Die App baut keine Netzwerkverbindung auf.
- Entwickelt wird in der Cloud ohne Xcode. Gebaut und geprüft wird über GitHub Actions auf einem macOS-Runner.

## Wege, die zur Wahl standen

1. **Native App mit Apples KI auf dem Gerät (gewählt).** Erfüllt „nur lokal" ohne Abstriche. Das Modell kann Deutsch und liefert feste Strukturen.
2. **Web-App auf dem Home-Bildschirm.** Kein Mac nötig, kann aber das Apple-Modell nicht nutzen und der Speicher ist weniger verlässlich.
3. **Lokal speichern, Auswertung über einen Cloud-Dienst.** Klügere Auswertung, aber jeder Eintrag ginge übers Internet. Ausgeschlossen.

## Aufbau

Die Entscheidungen in diesem Abschnitt hat Claude getroffen, nicht der Nutzer.

**Zwei Schichten.** Die Hülle ist nativ in SwiftUI: Sperre, Speicher, Fragebogen, Import, Tagebuch, KI. Die 3D-Szene (Galaxie und Sonnensystem) läuft als mitgelieferte Seite in einer Web-Ansicht mit three.js. Grund: Die Szene lässt sich so in der Cloud wirklich ansehen und prüfen, und der im Gespräch gezeigte Prototyp wird direkt weiterverwendet. Die Web-Ansicht lädt nur Dateien aus der App und bekommt eine Regel, die jeden Netzwerkzugriff sperrt.

**Kern als Swift-Paket (`LebensKern`).** Datenmodell, Zeitrechnung, Fragebogen-Inhalt, Zuordnung nach Stichwörtern, Erkennen von Jahreszahlen, Aufbereitung der Szenendaten, Texte für den Überblick. Ohne Apple-Frameworks, damit es unter Linux getestet werden kann.

**Speicher.** Ein einziger Datenbestand als JSON, mit AES-GCM verschlüsselt in einer Datei im App-Ordner. Der Schlüssel liegt im Schlüsselbund, nur auf diesem Gerät, und wird nur nach Face ID oder Gerätecode herausgegeben. Die Datei ist vom iCloud-Backup ausgenommen und hat den höchsten Dateischutz. Eingelesene Dokumente werden genauso verschlüsselt abgelegt.

**Sperre.** Beim Start und nach der Rückkehr aus dem Hintergrund verlangt die App Face ID. Im Hintergrund werden Schlüssel und entschlüsselte Daten aus dem Speicher entfernt, und ein Sichtschutz verdeckt die Vorschau im App-Umschalter.

**KI.** Apples Foundation-Models-Framework mit festen Ausgabestrukturen. Drei Aufgaben: einen Tag den Lebensbereichen zuordnen und zusammenfassen, Stationen aus Dokumenttext lesen, Menschen und Vorhaben aus Einträgen erkennen. Ist das Modell nicht verfügbar, greift eine einfache Zuordnung nach Stichwörtern.

**Dokumente.** PDF-Text über PDFKit, sonst Texterkennung des iPhones (Vision), beides ohne Netz.

**Sicherung.** Export als verschlüsselte Datei mit selbst gewähltem Passwort, Wiedereinlesen ebenso. Außerdem „Alles löschen".

## Daten

- **Profil:** Rufname, Geburtsdatum.
- **Ereignis:** Titel, Datum (Jahr genügt), Lebensbereich, Gewicht, Text, Herkunft (Fragebogen, Dokument, von Hand).
- **Notiz:** Zeitpunkt, Text.
- **Tag:** Datum, Notizen, freier Text, Stimmung 1 bis 5, Lebensbereiche, Kurzfassung.
- **Phase:** Beginn, Ende (offen möglich), Name. Wird als Dunkelwolke gezeigt.
- **Mond:** Name, Lebensbereich, Art (Mensch, Vorhaben, Ziel).
- **Antworten** des Fragebogens und **Dokumente** mit erkanntem Text.

Lebensbereiche sind fest: Menschen, Arbeit, Gesundheit, Geld, Träume.

## Bildschirme

1. **Sperre.**
2. **Erster Start:** Rufname und Geburtsdatum, danach Angebot, mit dem Fragebogen zu beginnen.
3. **Welt:** die 3D-Szene bildschirmfüllend. Oben Umschalter Galaxie und Sonnensystem, unten Notizfeld und „Tag abschließen". Antippen eines Sterns, Planeten oder einer Wolke zeigt eine Karte.
4. **Tagesabschluss:** Notizen des Tages, freier Text, Stimmung, vorgeschlagene Bereiche. Bestätigen löst das Verschmelzen aus.
5. **Fragebogen:** Kapitel mit Fortschritt, jederzeit unterbrechbar, jede Frage überspringbar.
6. **Dokumente:** einlesen, erkannte Stationen prüfen, übernehmen.
7. **Tagebuch:** alle Tage zum Nachlesen.
8. **Phasen:** schwere Zeiten anlegen und beenden.
9. **Einstellungen:** Sicherung, Löschen, Stand der KI.

## Etappen

1. Welt, Notizen, Tagesabschluss, Sperre und Verschlüsselung.
2. Fragebogen.
3. Dokumenten-Import.

Alle drei werden in einem Zug gebaut.

## Offen für den Bau

- Feinschliff der Szene (Farben, Dichte, Tempo) nach dem ersten Lauf auf dem echten Gerät.
- Wie gut das Apple-Modell deutsche Lebensläufe liest, zeigt sich erst auf dem Gerät. Deshalb wird jede Station bestätigt.
