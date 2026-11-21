import Foundation

/// Die fünf festen Lebensbereiche. Jeder ist in der Szene ein Planet und eine Farbe.
public enum Bereich: String, Codable, CaseIterable, Sendable, Identifiable {
    case menschen, arbeit, gesundheit, geld, traeume

    public var id: String { rawValue }

    public var titel: String {
        switch self {
        case .menschen: return "Menschen"
        case .arbeit: return "Arbeit"
        case .gesundheit: return "Gesundheit"
        case .geld: return "Geld"
        case .traeume: return "Träume"
        }
    }
}

public struct Profil: Codable, Equatable, Sendable {
    public var rufname: String
    public var geburt: Date

    public init(rufname: String, geburt: Date) {
        self.rufname = rufname
        self.geburt = geburt
    }
}

public enum Herkunft: String, Codable, Sendable {
    case fragebogen, dokument, hand
}

/// Ein Stern in der Galaxie: etwas, das an einem Datum passiert ist.
public struct Ereignis: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var titel: String
    public var datum: Date
    public var bereich: Bereich
    /// 1 klein, 2 wichtig, 3 prägend. Ab 2 bekommt der Stern eine Beschriftung.
    public var gewicht: Int
    public var text: String
    public var herkunft: Herkunft
    /// Frage oder Dokument, aus dem das Ereignis abgeleitet wurde.
    public var quelle: String?

    public init(id: UUID = UUID(), titel: String, datum: Date, bereich: Bereich, gewicht: Int = 2,
                text: String = "", herkunft: Herkunft = .hand, quelle: String? = nil) {
        self.id = id
        self.titel = titel
        self.datum = datum
        self.bereich = bereich
        self.gewicht = gewicht
        self.text = text
        self.herkunft = herkunft
        self.quelle = quelle
    }
}

/// Eine kurze Notiz über den Tag, in der Szene ein Funke.
public struct Notiz: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var zeit: Date
    public var text: String

    public init(id: UUID = UUID(), zeit: Date, text: String) {
        self.id = id
        self.zeit = zeit
        self.text = text
    }
}

/// Ein abgeschlossener Tag.
public struct Tag: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    /// Beginn des Tages.
    public var datum: Date
    public var notizen: [Notiz]
    public var text: String
    /// 1 bis 5, 0 heißt keine Angabe.
    public var stimmung: Int
    public var bereiche: [Bereich]
    public var kurz: String

    public init(id: UUID = UUID(), datum: Date, notizen: [Notiz] = [], text: String = "", stimmung: Int = 0,
                bereiche: [Bereich] = [], kurz: String = "") {
        self.id = id
        self.datum = datum
        self.notizen = notizen
        self.text = text
        self.stimmung = stimmung
        self.bereiche = bereiche
        self.kurz = kurz
    }
}

/// Eine schwere Zeit, in der Szene eine Dunkelwolke.
public struct Phase: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var beginn: Date
    /// nil heißt: dauert noch an.
    public var ende: Date?
    public var quelle: String?

    public init(id: UUID = UUID(), name: String, beginn: Date, ende: Date? = nil, quelle: String? = nil) {
        self.id = id
        self.name = name
        self.beginn = beginn
        self.ende = ende
        self.quelle = quelle
    }
}

public enum MondArt: String, Codable, Sendable, CaseIterable {
    case mensch, vorhaben, ziel

    public var titel: String {
        switch self {
        case .mensch: return "Mensch"
        case .vorhaben: return "Vorhaben"
        case .ziel: return "Ziel"
        }
    }
}

/// Etwas, das gerade zu einem Lebensbereich gehört und dessen Planeten umkreist.
public struct Mond: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var bereich: Bereich
    public var art: MondArt
    public var quelle: String?

    public init(id: UUID = UUID(), name: String, bereich: Bereich, art: MondArt, quelle: String? = nil) {
        self.id = id
        self.name = name
        self.bereich = bereich
        self.art = art
        self.quelle = quelle
    }
}

public struct Dokument: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var name: String
    public var datum: Date
    public var text: String
    /// Name der verschlüsselten Originaldatei im Tresor, falls aufbewahrt.
    public var datei: String?

    public init(id: UUID = UUID(), name: String, datum: Date, text: String, datei: String? = nil) {
        self.id = id
        self.name = name
        self.datum = datum
        self.text = text
        self.datei = datei
    }
}

/// Eine Zeile in einer Listen-Antwort des Fragebogens.
public struct Eintrag: Codable, Identifiable, Equatable, Sendable {
    public var id: UUID
    public var titel: String
    public var jahr: Int?
    public var bisJahr: Int?
    public var notiz: String

    public init(id: UUID = UUID(), titel: String = "", jahr: Int? = nil, bisJahr: Int? = nil, notiz: String = "") {
        self.id = id
        self.titel = titel
        self.jahr = jahr
        self.bisJahr = bisJahr
        self.notiz = notiz
    }
}

public struct Antwort: Codable, Equatable, Sendable {
    public var text: String
    public var eintraege: [Eintrag]
    public var wahl: [String]
    /// Skala 1 bis 5, 0 heißt keine Angabe.
    public var wert: Int

    public init(text: String = "", eintraege: [Eintrag] = [], wahl: [String] = [], wert: Int = 0) {
        self.text = text
        self.eintraege = eintraege
        self.wahl = wahl
        self.wert = wert
    }

    public var istLeer: Bool {
        text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && eintraege.allSatisfy { $0.titel.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            && wahl.isEmpty && wert == 0
    }
}

/// Alles, was die App über ein Leben weiß. Wird als Ganzes verschlüsselt gespeichert.
public struct Bestand: Codable, Equatable, Sendable {
    public var version: Int
    public var profil: Profil?
    public var ereignisse: [Ereignis]
    /// Notizen, die noch zu keinem abgeschlossenen Tag gehören.
    public var notizen: [Notiz]
    public var tage: [Tag]
    public var phasen: [Phase]
    public var monde: [Mond]
    public var antworten: [String: Antwort]
    public var dokumente: [Dokument]

    public init(version: Int = 1, profil: Profil? = nil, ereignisse: [Ereignis] = [], notizen: [Notiz] = [],
                tage: [Tag] = [], phasen: [Phase] = [], monde: [Mond] = [], antworten: [String: Antwort] = [:],
                dokumente: [Dokument] = []) {
        self.version = version
        self.profil = profil
        self.ereignisse = ereignisse
        self.notizen = notizen
        self.tage = tage
        self.phasen = phasen
        self.monde = monde
        self.antworten = antworten
        self.dokumente = dokumente
    }

    public var istLeer: Bool {
        ereignisse.isEmpty && notizen.isEmpty && tage.isEmpty && phasen.isEmpty && monde.isEmpty
    }
}
