# Hochformat

Web-App fürs iPhone: Foto wählen, per KI schärfen und hochrechnen lassen, als
4K-Bild im Format 9:16 (2160 × 3840) in der Fotos-App sichern.

## So funktioniert es

1. Du wählst ein Foto. Ist es nicht 9:16, entscheidest du: **Füllen** schneidet
   die Ränder ab, **Einpassen** zeigt das ganze Foto auf weichem Hintergrund.
2. Der Server schickt das Foto mit dem Prompt aus `lib/prompt.ts` an ein
   Bildmodell (Standard: `google/gemini-nano-banana-2.1`, Ausgabe in 4K) über
   das Vercel AI Gateway.
3. Der Browser bringt das Ergebnis auf exakt 2160 × 3840, speichert es
   verlustfrei als PNG und füllt die Datei bei Bedarf auf mindestens 10 MB auf.
   Das Auffüllen ändert keinen Bildpunkt (siehe `lib/png.ts`).
4. **In Fotos sichern** öffnet das Teilen-Menü, dort „Bild sichern“ wählen.

## Einrichten auf Vercel

- Projekt aus diesem Repository anlegen.
- Umgebungsvariable `APP_PASSWORD` setzen. Ohne sie verweigert die App in
  Produktion die Arbeit, weil jedes Bild KI-Guthaben kostet.
- AI Gateway für das Team aktivieren und Guthaben bereitstellen. Die Anmeldung
  läuft auf Vercel automatisch, ein API-Schlüssel ist dort nicht nötig.
- Auf dem iPhone die Adresse in Safari öffnen, dann Teilen → „Zum
  Home-Bildschirm“.

## Lokal entwickeln

```bash
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

```bash
npm test        # Logik-Tests
npm run lint
npm run build
```

## Aufbau

| Datei | Aufgabe |
| --- | --- |
| `app/studio.tsx` | Oberfläche und Ablauf |
| `app/api/enhance/route.ts` | Passwort prüfen, Foto ans Modell geben, Ergebnis streamen |
| `lib/prompt.ts` | Der Prompt |
| `lib/enhance.ts` | Aufruf des Bildmodells |
| `lib/browser-image.ts` | Zuschneiden, Einpassen, PNG-Export im Browser |
| `lib/frame.ts`, `lib/png.ts` | Geometrie und Dateigröße |
