import Foundation

/// Alles, was die 3D-Szene zum Zeichnen braucht. Wird als JSON an die Web-Ansicht übergeben.
public struct Szene: Codable, Equatable, Sendable {
    public struct Stern: Codable, Equatable, Sendable {
        public var id: String
        /// Jahre seit der Geburt.
        public var t: Double
        public var name: String
        public var jahr: String
        /// Rohwert eines Bereichs oder leer.
        public var bereich: String
        public var gewicht: Int
        public var text: String
        /// "ereignis" oder "tag"
        public var art: String
    }

    public struct Wolke: Codable, Equatable, Sendable {
        public var id: String
        public var t0: Double
        public var t1: Double
        public var name: String
        public var dauer: String
        public var offen: Bool
        public var text: String
    }

    public struct MondDaten: Codable, Equatable, Sendable {
        public var id: String
        public var name: String
        public var art: String
    }

    public struct Planet: Codable, Equatable, Sendable {
        public var bereich: String
        public var name: String
        /// "sturm", "ruhig" oder "hell"
        public var zustand: String
        public var eintraege: Int
        public var text: String
        public var monde: [MondDaten]
        /// Monde, die in der Szene nicht mehr Platz haben. Sie stehen in der Mondliste.
        public var weitere: Int
    }

    public var rufname: String
    public var alter: Double
    public var geburtsjahr: Int
    public var sterne: [Stern]
    public var wolken: [Wolke]
    public var planeten: [Planet]
    /// Offene Notizen von heute.
    public var funken: Int
    public var tagZu: Bool
    public var ueberblick: String
}

public enum Szenenbau {
    /// So viele Monde zeichnet die Szene pro Planet. Alle weiteren werden gezählt und in der Detailkarte genannt.
    public static let mondeProPlanet = 6

    public static func baue(_ bestand: Bestand, heute: Date, kalender: Calendar = .current) -> Szene {
        let geburt = bestand.profil?.geburt ?? heute.addingTimeInterval(-Zeit.jahrInSekunden)
        let alter = max(1, Zeit.alter(geburt: geburt, am: heute))
        func t(_ datum: Date) -> Double { min(alter, Zeit.alter(geburt: geburt, am: datum)) }

        var sterne = bestand.ereignisse.filter { $0.datum <= heute }.map {
            Szene.Stern(id: $0.id.uuidString, t: t($0.datum), name: $0.titel, jahr: "\(Zeit.jahr($0.datum, kalender: Zeit.fest))",
                        bereich: $0.bereich.rawValue, gewicht: min(3, max(1, $0.gewicht)), text: $0.text, art: "ereignis")
        }
        sterne += bestand.tage.filter { !kalender.isDate($0.datum, inSameDayAs: heute) }.map {
            Szene.Stern(id: $0.id.uuidString, t: t($0.datum), name: Zeit.kurz($0.datum, kalender: kalender), jahr: "",
                        bereich: $0.bereiche.first?.rawValue ?? "", gewicht: 0,
                        text: $0.kurz.isEmpty ? Zuordnung.kurzfassung($0.text) : $0.kurz, art: "tag")
        }
        sterne.sort { $0.t < $1.t }

        let brief = bestand.antworten[FragebogenInhalt.briefFrage]?.text.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let wolken = bestand.phasen.filter { $0.beginn <= heute }.map { phase -> Szene.Wolke in
            let offen = phase.ende == nil || (phase.ende ?? heute) >= heute
            let ende = min(phase.ende ?? heute, heute)
            let dauer = Ueberblick.dauer(von: phase.beginn, bis: ende)
            var text = offen ? "Dauert seit \(dauer) an." : "Dauerte \(dauer) und ist vorbeigegangen."
            if offen, !brief.isEmpty { text += " Du hast dir selbst geschrieben: „\(brief)“" }
            return Szene.Wolke(id: phase.id.uuidString, t0: t(phase.beginn), t1: max(t(phase.beginn), t(ende)), name: phase.name,
                               dauer: dauer, offen: offen, text: text)
        }

        let seit = heute.addingTimeInterval(-30 * 86_400)
        let letzte = bestand.tage.filter { $0.datum >= seit && $0.datum <= heute }
        let planeten = Bereich.allCases.map { bereich -> Szene.Planet in
            let tage = letzte.filter { $0.bereiche.contains(bereich) }
            let bewertet = tage.filter { $0.stimmung > 0 }
            var zustand = "ruhig"
            var text = tage.isEmpty ? "Noch keine Einträge in den letzten 30 Tagen."
                : "\(tage.count) \(tage.count == 1 ? "Eintrag" : "Einträge") in den letzten 30 Tagen. Zieht ruhig seine Bahn."
            if !bewertet.isEmpty {
                let mittel = Double(bewertet.reduce(0) { $0 + $1.stimmung }) / Double(bewertet.count)
                if mittel <= 2.3 {
                    zustand = "sturm"
                    text = "Hier ist gerade Sturm. \(tage.count) \(tage.count == 1 ? "Eintrag" : "Einträge") in den letzten 30 Tagen, die Stimmung war meist gedrückt."
                } else if mittel >= 3.7 {
                    zustand = "hell"
                    text = "Dieser Bereich trägt dich gerade. \(tage.count) \(tage.count == 1 ? "Eintrag" : "Einträge") in den letzten 30 Tagen."
                }
            }
            let alleMonde = bestand.monde.filter { $0.bereich == bereich }
            let monde = alleMonde.prefix(Szenenbau.mondeProPlanet).map {
                Szene.MondDaten(id: $0.id.uuidString, name: $0.name, art: $0.art.rawValue)
            }
            return Szene.Planet(bereich: bereich.rawValue, name: bereich.titel, zustand: zustand, eintraege: tage.count,
                                text: text, monde: Array(monde), weitere: max(0, alleMonde.count - Szenenbau.mondeProPlanet))
        }

        return Szene(rufname: bestand.profil?.rufname ?? "", alter: alter, geburtsjahr: Zeit.jahr(geburt, kalender: Zeit.fest),
                     sterne: sterne, wolken: wolken, planeten: planeten,
                     funken: bestand.notizen(am: heute, kalender: kalender).count,
                     tagZu: bestand.tag(am: heute, kalender: kalender) != nil,
                     ueberblick: Ueberblick.text(bestand, heute: heute))
    }
}
