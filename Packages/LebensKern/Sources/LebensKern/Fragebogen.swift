import Foundation

/// Wie eine Listen-Antwort in die Galaxie übersetzt wird.
public struct EintragVorlage: Sendable, Equatable {
    public var bereich: Bereich
    /// Fragt zusätzlich nach einem Endjahr.
    public var mitBis: Bool
    /// Jede Zeile mit Jahr wird ein Stern.
    public var ereignis: Bool
    /// Jede Zeile, die noch andauert, wird ein Mond dieser Art.
    public var mond: MondArt?
    /// Jede Zeile wird eine Dunkelwolke statt eines Sterns.
    public var phase: Bool
    public var gewicht: Int
    public var platzhalter: String
    /// Titel des Sterns, "%@" steht für die Eingabe.
    public var ereignisTitel: String

    public init(_ bereich: Bereich, mitBis: Bool = false, ereignis: Bool = true, mond: MondArt? = nil, phase: Bool = false,
                gewicht: Int = 2, platzhalter: String = "", ereignisTitel: String = "%@") {
        self.bereich = bereich
        self.mitBis = mitBis
        self.ereignis = ereignis
        self.mond = mond
        self.phase = phase
        self.gewicht = gewicht
        self.platzhalter = platzhalter
        self.ereignisTitel = ereignisTitel
    }
}

public enum FrageArt: Sendable, Equatable {
    case text
    case langtext
    case eintraege(EintragVorlage)
    case wahl([String])
    /// Skala 1 bis 5 mit Beschriftung für beide Enden.
    case skala(String, String)
}

public struct Frage: Identifiable, Sendable, Equatable {
    public let id: String
    public let titel: String
    public let hilfe: String
    public let art: FrageArt

    public init(_ id: String, _ titel: String, hilfe: String = "", _ art: FrageArt) {
        self.id = id
        self.titel = titel
        self.hilfe = hilfe
        self.art = art
    }
}

public struct Kapitel: Identifiable, Sendable, Equatable {
    public let id: String
    public let titel: String
    public let einleitung: String
    /// Name eines SF-Symbols.
    public let symbol: String
    public let fragen: [Frage]

    public init(_ id: String, _ titel: String, symbol: String, einleitung: String, _ fragen: [Frage]) {
        self.id = id
        self.titel = titel
        self.symbol = symbol
        self.einleitung = einleitung
        self.fragen = fragen
    }
}

extension Bestand {
    /// Speichert eine Antwort und ersetzt alles, was aus dieser Frage abgeleitet war. Nichts wird verdoppelt.
    public mutating func uebernehme(_ antwort: Antwort, fuer frage: Frage, heute: Date) {
        antworten[frage.id] = antwort.istLeer ? nil : antwort
        ereignisse.removeAll { $0.quelle == frage.id }
        monde.removeAll { $0.quelle == frage.id }
        phasen.removeAll { $0.quelle == frage.id }
        guard case .eintraege(let vorlage) = frage.art else { return }

        let jahrHeute = Zeit.jahr(heute, kalender: Zeit.fest)
        for eintrag in antwort.eintraege {
            let titel = eintrag.titel.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !titel.isEmpty else { continue }
            let jahr = eintrag.jahr.flatMap { (1900...jahrHeute).contains($0) ? $0 : nil }
            let bis = eintrag.bisJahr.flatMap { b in jahr.map { max($0, min(b, jahrHeute)) } }

            if vorlage.phase {
                guard let jahr else { continue }
                let einJahr = bis == nil || bis == jahr
                let beginn = Zeit.datum(jahr: jahr, monat: einJahr ? 4 : 7, tag: 1)
                let ende = min(Zeit.datum(jahr: bis ?? jahr, monat: einJahr ? 9 : 6, tag: 30), heute)
                phasen.append(Phase(name: titel, beginn: beginn, ende: max(ende, beginn), quelle: frage.id))
                continue
            }
            if vorlage.ereignis, let jahr {
                ereignisse.append(Ereignis(titel: vorlage.ereignisTitel.replacingOccurrences(of: "%@", with: titel),
                                           datum: Zeit.datum(jahr: jahr), bereich: vorlage.bereich,
                                           gewicht: vorlage.gewicht, text: eintrag.notiz, herkunft: .fragebogen,
                                           quelle: frage.id))
            }
            if let art = vorlage.mond, bis == nil || bis == jahrHeute {
                monde.append(Mond(name: titel, bereich: vorlage.bereich, art: art, quelle: frage.id))
            }
        }
        phasen.sort { $0.beginn < $1.beginn }
    }

    /// Anteil beantworteter Fragen eines Kapitels, 0 bis 1.
    public func fortschritt(_ kapitel: Kapitel) -> Double {
        guard !kapitel.fragen.isEmpty else { return 0 }
        let n = kapitel.fragen.filter { antworten[$0.id] != nil }.count
        return Double(n) / Double(kapitel.fragen.count)
    }
}
