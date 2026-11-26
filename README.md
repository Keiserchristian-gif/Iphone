# Gedanken

Notizen und Ideen einsprechen, den Kern als wachsende Mindmap sehen, Erledigtes abhaken und löschen, alles sortiert als PDF sichern. Web-App im iPhone-Look, ohne Build-Schritt und ohne Fremdbibliotheken.

## Ausprobieren

```bash
npm run serve        # http://127.0.0.1:4173/
```

Auf dem iPhone: die Seite in Safari öffnen (sie muss dafür über HTTPS erreichbar sein) und über „Teilen › Zum Home-Bildschirm" ablegen. Danach startet sie wie eine App und läuft auch ohne Netz.

## Was die App kann

- **Sprechen oder diktieren:** Das Mikrofon nutzt die Spracherkennung des Browsers. Wo es die nicht gibt, öffnet sich ein Eingabefeld für die Diktiertaste der Tastatur.
- **Kern erkennen:** Aus dem Satz werden Kern, Bereich (Arbeit / Privat / Ideen), Termin (heute, morgen, Wochentag, „3.12.") und Wichtigkeit gelesen. Mehrere Sätze ergeben mehrere Gedanken.
- **Karte:** Jeder Gedanke bekommt einen festen, überlappungsfreien Platz bei seinem Bereich. Die Karte wächst beliebig und zoomt so, dass alles sichtbar bleibt; ziehen und mit zwei Fingern zoomen geht auch.
- **Abhaken und löschen:** Kreis antippen = erledigt. Erledigtes steht in der Liste, lässt sich zurückholen oder endgültig löschen. Löschen aus dem Detailblatt hat „Rückgängig".
- **PDF:** sortiert nach Bereich oder Wichtigkeit, wahlweise mit Erledigtem.

## Grenzen

- **Fester Speicherort:** Einen Ordner dauerhaft festlegen können nur Chrome und Edge am Rechner. Safari auf dem iPhone erlaubt das Web-Apps nicht: dort öffnet „PDF sichern" das Teilen-Menü („In Dateien sichern"), iOS fragt nach dem Ordner und merkt sich den letzten. Ein fest hinterlegter Ordner auf dem iPhone braucht eine native App.
- **Kern-Erkennung:** Ohne KI arbeitet eine Stichwort-Logik (`src/core.js`). In der Claude-Vorschau wertet Claude den Satz aus.
- **Daten:** liegen nur im Browser dieses Geräts (`localStorage`), es gibt keinen Abgleich zwischen Geräten.

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html` | Seitengerüst |
| `src/core.js` | Logik: Kern, Termine, Platzierung, Sortierung |
| `src/pdf.js` | PDF-Schreiber (A4, Umlaute) |
| `src/app.js` | Oberfläche |
| `src/styles.css` | Aussehen, hell und dunkel |
| `sw.js`, `manifest.webmanifest`, `icons/` | Home-Bildschirm und Offline-Betrieb |
| `tools/` | Testserver, Icons, Ein-Datei-Fassung für die Claude-Vorschau |

## Tests

```bash
npm test             # Logik und PDF (braucht pdftotext)
npm run e2e          # Oberfläche im iPhone-Format (braucht Playwright mit Chromium)
npm run build:artifact   # dist/gedankenkarte.html für die Claude-Vorschau
```
