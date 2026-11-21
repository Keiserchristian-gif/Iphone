import Foundation

/// Einfache Zuordnung nach Stichwörtern. Greift, wenn das KI-Modell des Geräts nicht verfügbar ist.
public enum Zuordnung {
    static let woerter: [Bereich: [String]] = [
        .menschen: ["freund", "famil", "mama", "papa", "mutter", "vater", "bruder", "schwester", "oma", "opa", "partner",
                    "telefon", "angerufen", "getroffen", "treffen", "besuch", "streit", "gespräch", "kolleg", "nachbar",
                    "kind", "tochter", "sohn", "liebe", "einsam", "allein", "zusammen", "geredet", "umarm", "verein"],
        .arbeit: ["arbeit", "job", "chef", "büro", "firma", "bewerb", "absage", "zusage", "kündig", "gehaltsgespräch",
                  "meeting", "projekt", "kunde", "schicht", "überstunden", "ausbildung", "studium", "prüfung", "werkstatt",
                  "auftrag", "betrieb", "vorstellungsgespräch", "lehre", "schule", "uni", "lernen", "feierabend"],
        .gesundheit: ["schlaf", "geschlafen", "müde", "arzt", "ärztin", "krank", "schmerz", "sport", "gelaufen", "laufen",
                      "joggen", "training", "fitness", "gegessen", "essen", "gekocht", "kochen", "spazier", "wander",
                      "kopfweh", "erkält", "therapie", "erschöpf", "energie", "ruhe", "stress", "yoga", "rad"],
        .geld: ["geld", "gehalt", "miete", "rechnung", "schulden", "kredit", "gespart", "sparen", "konto", "bank",
                "steuer", "kauf", "gekauft", "teuer", "bezahlt", "versicherung", "lohn", "bonus", "wohnung", "umzug"],
        .traeume: ["traum", "träum", "ziel", "plan", "idee", "wunsch", "irgendwann", "reise", "urlaub", "eigene",
                   "selbstständig", "gründen", "vorgenommen", "hoffnung", "zukunft", "gemalt", "geschrieben", "musik",
                   "gebaut", "gebastelt", "hobby", "stolz"],
    ]

    /// Bis zu drei Bereiche, der treffendste zuerst. Leer, wenn nichts passt.
    public static func bereiche(fuer text: String) -> [Bereich] {
        let klein = text.lowercased()
        guard !klein.isEmpty else { return [] }
        var treffer: [(Bereich, Int)] = []
        for bereich in Bereich.allCases {
            let n = (woerter[bereich] ?? []).reduce(0) { $0 + (klein.contains($1) ? 1 : 0) }
            if n > 0 { treffer.append((bereich, n)) }
        }
        return treffer.sorted { $0.1 > $1.1 }.prefix(3).map(\.0)
    }

    /// Erster Satz, höchstens `max` Zeichen.
    public static func kurzfassung(_ text: String, max: Int = 90) -> String {
        let sauber = text.replacingOccurrences(of: "\n", with: " ").trimmingCharacters(in: .whitespacesAndNewlines)
        guard !sauber.isEmpty else { return "" }
        var satz = sauber
        if let ende = sauber.firstIndex(where: { ".!?".contains($0) }), sauber.distance(from: sauber.startIndex, to: ende) >= 12 {
            satz = String(sauber[...ende])
        }
        guard satz.count > max else { return satz }
        let schnitt = satz.prefix(max - 1)
        if let leer = schnitt.lastIndex(of: " "), schnitt.distance(from: schnitt.startIndex, to: leer) > max / 2 {
            return String(schnitt[..<leer]) + "…"
        }
        return String(schnitt) + "…"
    }
}
