import CryptoKit
import Foundation
import LebensKern
import Observation

/// Der Zustand der ganzen App: Sperre, Datenbestand, Speichern.
@MainActor
@Observable
final class AppModel {
    enum Zustand { case gesperrt, offen }

    var zustand: Zustand = .gesperrt
    var bestand = Bestand()
    /// Hinweis auf dem Sperrbildschirm.
    var meldung: String?
    var oeffnetGerade = false
    /// Hinweis, wenn Speichern scheitert. Wird in der Welt angezeigt.
    var speicherFehler: String?
    /// Zählt hoch, wenn die Szene neue Daten braucht.
    var szenenStand = 0
    /// Die letzten Tage waren schwer: Die Welt fragt, ob das eine Dunkelwolke werden soll.
    var phasenVorschlag = false
    let demo: Bool

    @ObservationIgnored private var schluessel: SymmetricKey?
    @ObservationIgnored private var tresor: Tresor?

    init() {
        #if DEBUG
        demo = ProcessInfo.processInfo.arguments.contains("-demo")
        #else
        demo = false
        #endif
        if demo {
            bestand = .beispiel(heute: .now)
            zustand = .offen
        }
    }

    // MARK: Sperre

    func oeffne() async {
        guard zustand == .gesperrt, !oeffnetGerade else { return }
        oeffnetGerade = true
        defer { oeffnetGerade = false }
        do {
            let t = try tresor ?? Tresor()
            tresor = t
            let kontext = try await Tresor.pruefe(grund: "Deine Lebensgalaxie öffnen")
            let s = try t.schluessel(kontext: kontext)
            var b = Bestand()
            if let roh = try t.ladeBestand(s) {
                guard let gelesen = try? JSONDecoder().decode(Bestand.self, from: roh) else { throw TresorFehler.beschaedigt }
                b = gelesen
            }
            b.raeumeAuf(heute: .now)
            schluessel = s
            bestand = b
            meldung = nil
            zustand = .offen
            speichere()
        } catch let fehler as TresorFehler {
            meldung = fehler.errorDescription
        } catch {
            meldung = "Das Öffnen hat nicht geklappt. \(error.localizedDescription)"
        }
    }

    /// Entfernt Schlüssel und entschlüsselte Daten aus dem Arbeitsspeicher.
    func sperre() {
        guard !demo, zustand == .offen else { return }
        speichere()
        schluessel = nil
        bestand = Bestand()
        zustand = .gesperrt
    }

    // MARK: Ändern und Speichern

    /// Ändert den Datenbestand und speichert sofort. `szene: false`, wenn die Szene die Änderung selbst animiert.
    func aendere(szene: Bool = true, _ aenderung: (inout Bestand) -> Void) {
        aenderung(&bestand)
        speichere()
        if szene { szenenStand += 1 }
    }

    func speichere() {
        guard !demo, let schluessel, let tresor else { return }
        do {
            try tresor.speichereBestand(JSONEncoder().encode(bestand), schluessel)
            speicherFehler = nil
        } catch {
            speicherFehler = "Speichern hat nicht geklappt. Prüfe, ob auf dem iPhone noch Platz ist."
        }
    }

    var szene: Szene { Szenenbau.baue(bestand, heute: .now) }

    // MARK: Tag

    func notiere(_ text: String) {
        aendere(szene: false) { $0.notiere(text, am: .now) }
    }

    func schliesseTag(text: String, stimmung: Int, bereiche: [Bereich], kurz: String) {
        aendere(szene: false) { $0.schliesseTag(am: .now, text: text, stimmung: stimmung, bereiche: bereiche, kurz: kurz) }
        let woche = Date.now.addingTimeInterval(-7 * 86_400)
        let schwer = bestand.tage.filter { $0.datum >= woche && (1...2).contains($0.stimmung) }.count
        let offen = bestand.phasen.contains { $0.ende == nil }
        phasenVorschlag = schwer >= 4 && !offen
    }

    // MARK: Dokumente

    func bewahreOriginal(_ daten: Data) -> String? {
        guard !demo, let schluessel, let tresor else { return nil }
        let name = "dokument-\(UUID().uuidString).lg"
        do {
            try tresor.speichereDatei(daten, name: name, schluessel)
            return name
        } catch {
            return nil
        }
    }

    func loesche(dokument: Dokument, mitSternen: Bool) {
        if let datei = dokument.datei { tresor?.loescheDatei(name: datei) }
        aendere {
            $0.dokumente.removeAll { $0.id == dokument.id }
            if mitSternen { $0.ereignisse.removeAll { $0.quelle == dokument.id.uuidString } }
        }
    }

    // MARK: Sicherung und Löschen

    func sicherung(passwort: String) throws -> Data {
        try Sicherung.verpacke(JSONEncoder().encode(bestand), passwort: passwort)
    }

    func stelleWiederHer(_ paket: Data, passwort: String) throws {
        let roh = try Sicherung.entpacke(paket, passwort: passwort)
        guard let gelesen = try? JSONDecoder().decode(Bestand.self, from: roh) else { throw SicherungsFehler.falschesPasswortOderDatei }
        aendere { bestand in
            bestand = gelesen
            // Originaldateien stecken nicht in der Sicherung, nur der erkannte Text.
            for i in bestand.dokumente.indices { bestand.dokumente[i].datei = nil }
        }
    }

    func loescheAlles() {
        tresor?.loescheAlles()
        schluessel = nil
        bestand = Bestand()
        zustand = demo ? .offen : .gesperrt
        szenenStand += 1
    }
}
