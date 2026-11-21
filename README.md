# Lebensgalaxie

Eine iPhone-App, die dein Leben von oben zeigt: als drehbare Galaxie für den Verlauf und als Sonnensystem für den jetzigen Stand. Alle Daten bleiben verschlüsselt auf deinem iPhone.

## Was die App kann

- **Galaxie:** Innen deine Geburt, außen heute, jede Umdrehung ein Jahrzehnt. Ereignisse sind Sterne in der Farbe ihres Lebensbereichs, schwere Phasen sind Dunkelwolken.
- **Sonnensystem:** Du bist die Sonne, deine fünf Lebensbereiche sind Planeten. Menschen, Vorhaben und Ziele kreisen als Monde. Ein Sturm auf einem Planeten zeigt, wo es gerade hakt.
- **Notizen und Tagesabschluss:** Tagsüber kurze Notizen, die als Funken um den heutigen Punkt kreisen. Abends verschmelzen sie zu einem Stern.
- **Zeitreise:** Ein Regler zeigt die Galaxie zu einem früheren Jahr.
- **Fragebogen:** 46 Fragen in 10 Kapiteln füllen die Galaxie mit deiner Vergangenheit.
- **Dokumente:** Lebenslauf als PDF, Foto oder Text einlesen. Erkannte Stationen bestätigst du einzeln.
- **Sicherheit:** Face ID, AES-256-Verschlüsselung, Schlüssel nur im Schlüsselbund dieses Geräts, kein Konto, kein Server, kein Netzwerkzugriff.

## Auf dein iPhone bringen

Du brauchst einen Mac mit Xcode 26 oder neuer und ein iPhone mit iOS 26 oder neuer.

1. **Xcode installieren.** Im App Store auf dem Mac nach „Xcode" suchen und laden. Das dauert, Xcode ist groß.
2. **Projekt laden.** Auf der GitHub-Seite dieses Projekts den Zweig `claude/keen-gauss-dfgwa8` wählen, dann „Code" und „Download ZIP". Die ZIP-Datei entpacken.
3. **Projekt öffnen.** Doppelklick auf `Lebensgalaxie.xcodeproj`.
4. **Apple-ID eintragen.** In Xcode oben im Menü „Xcode", „Settings", „Accounts", dann unten links das Plus und mit deiner Apple-ID anmelden.
5. **Team wählen.** Links in der Seitenleiste ganz oben auf „Lebensgalaxie" klicken, dann den Reiter „Signing & Capabilities" öffnen und bei „Team" deinen Namen auswählen. Meldet Xcode, die Kennung sei schon vergeben, ändere bei „Bundle Identifier" das Wort `lebensgalaxie` in etwas Eigenes.
6. **iPhone verbinden.** Mit dem Kabel an den Mac anschließen und am iPhone „Vertrauen" antippen. Beim ersten Mal am iPhone unter „Einstellungen", „Datenschutz & Sicherheit", „Entwicklermodus" den Entwicklermodus einschalten. Das iPhone startet dafür neu.
7. **Starten.** In Xcode oben in der Mitte dein iPhone als Ziel auswählen und auf den Play-Knopf drücken.
8. **App erlauben.** Beim ersten Start am iPhone unter „Einstellungen", „Allgemein", „VPN & Geräteverwaltung" deiner Apple-ID vertrauen. Danach die App noch einmal öffnen.

Mit einer kostenlosen Apple-ID läuft die App 7 Tage. Danach das iPhone wieder anschließen und in Xcode noch einmal auf Play drücken. Deine Daten bleiben dabei erhalten, solange du die App nicht vom iPhone löschst. Mit dem Apple-Entwicklerprogramm (99 US-Dollar im Jahr) hält sie ein Jahr.

Damit die App Einträge und Dokumente selbst auswertet, muss am iPhone Apple Intelligence eingeschaltet sein. Ohne ordnet sie nach Stichwörtern zu. Den Stand siehst du in der App unter „Mehr", „Einstellungen".

## Wichtig für deine Daten

- Lege regelmäßig eine Sicherung an: „Mehr", „Einstellungen", „Sicherung erstellen". Sie ist mit deinem Passwort verschlüsselt.
- Wenn du die App vom iPhone löschst, sind die Daten weg. Nur die Sicherung bringt sie zurück.
- Dieses Projekt auf GitHub enthält nur den Programmcode und ein erfundenes Beispiel-Leben. Deine Einträge landen nie hier.

## Aufbau

```
Lebensgalaxie/            die App (SwiftUI)
Packages/LebensKern/      Datenmodell, Fragebogen, Auswertung, mit Tests
Szene/                    Quellen der 3D-Szene (three.js)
mockups/                  Entwürfe und Prototyp aus der Planung
docs/                     Entwurf und Bauplan
```

Die 3D-Szene wird mit `python3 Szene/baue.py` zu `Lebensgalaxie/Ressourcen/szene.html` zusammengefügt. Die Tests des Kerns laufen mit `swift test --package-path Packages/LebensKern`.
