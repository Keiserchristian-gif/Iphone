import Foundation

/// Eine Station aus einem Dokument, zum Beispiel eine Zeile aus einem Lebenslauf.
public struct Station: Identifiable, Equatable, Sendable {
    public var id: UUID
    public var titel: String
    public var jahr: Int
    public var bisJahr: Int?
    public var bereich: Bereich
    public var laufend: Bool

    public init(id: UUID = UUID(), titel: String, jahr: Int, bisJahr: Int? = nil, bereich: Bereich = .arbeit, laufend: Bool = false) {
        self.id = id
        self.titel = titel
        self.jahr = jahr
        self.bisJahr = bisJahr
        self.bereich = bereich
        self.laufend = laufend
    }
}

/// Erkennt Stationen ohne KI: Zeilen mit Jahreszahlen. Dient als Rückfallebene und als Gegenprobe.
public enum Stationen {
    public static let hoechstens = 60

    static let jahrMuster = try! NSRegularExpression(pattern: #"(?<![\d.])(19[4-9]\d|20[0-4]\d)(?!\d)"#)
    static let datumMuster = try! NSRegularExpression(
        pattern: #"(\d{1,2}\.\s?\d{1,2}\.\s?|\d{1,2}\s?[./]\s?)?(19[4-9]\d|20[0-4]\d)"#)
    static let fuellMuster = try! NSRegularExpression(
        pattern: #"^(\s|[-–—:|,;/•·]|\b(seit|ab|bis|von|heute|jetzt|aktuell|present)\b)+"#, options: [.caseInsensitive])
    static let monatMuster = try! NSRegularExpression(
        pattern: #"\b(januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|jan|feb|mär|apr|jun|jul|aug|sep|sept|okt|nov|dez)\.?\s*$"#,
        options: [.caseInsensitive])

    public static func erkenne(in text: String, heute: Int) -> [Station] {
        let zeilen = text.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespaces) }
        var ergebnis: [Station] = []
        var i = 0
        while i < zeilen.count, ergebnis.count < hoechstens {
            defer { i += 1 }
            let zeile = zeilen[i]
            guard zeile.count >= 4, zeile.count <= 240 else { continue }
            let klein = zeile.lowercased()
            if klein.contains("geboren") || klein.contains("geburt") { continue }

            let jahre = treffer(jahrMuster, in: zeile).compactMap { Int($0) }.filter { $0 <= heute + 1 }
            guard let erstes = jahre.first else { continue }
            let zweites = jahre.dropFirst().first { $0 >= erstes }
            let laufend = klein.range(of: #"\b(seit|heute|aktuell|jetzt|present)\b"#, options: .regularExpression) != nil
                || klein.range(of: #"[-–—]\s*$"#, options: .regularExpression) != nil

            var titel = bereinige(zeile)
            if titel.count < 3, i + 1 < zeilen.count {
                let naechste = zeilen[i + 1]
                if !naechste.isEmpty, treffer(jahrMuster, in: naechste).isEmpty {
                    titel = bereinige(naechste)
                    i += 1
                }
            }
            guard titel.count >= 3 else { continue }
            let bis = laufend ? nil : (zweites == erstes ? nil : zweites)
            ergebnis.append(Station(titel: String(titel.prefix(80)), jahr: erstes, bisJahr: bis,
                                    bereich: Zuordnung.bereiche(fuer: titel).first ?? .arbeit, laufend: laufend))
        }
        return ergebnis
    }

    /// Teilt langen Text an Absätzen in Stücke, die das KI-Modell des Geräts verarbeiten kann.
    public static func stuecke(_ text: String, laenge: Int = 1800) -> [String] {
        let grenze = max(200, laenge)
        var stuecke: [String] = []
        var aktuell = ""
        for absatz in text.components(separatedBy: "\n") {
            var rest = absatz.trimmingCharacters(in: .whitespaces)
            if rest.isEmpty { continue }
            while rest.count > grenze {
                if !aktuell.isEmpty { stuecke.append(aktuell); aktuell = "" }
                stuecke.append(String(rest.prefix(grenze)))
                rest = String(rest.dropFirst(grenze))
            }
            if aktuell.count + rest.count + 1 > grenze, !aktuell.isEmpty {
                stuecke.append(aktuell)
                aktuell = ""
            }
            aktuell += (aktuell.isEmpty ? "" : "\n") + rest
        }
        if !aktuell.isEmpty { stuecke.append(aktuell) }
        return stuecke
    }

    static func treffer(_ muster: NSRegularExpression, in text: String) -> [String] {
        let ns = text as NSString
        return muster.matches(in: text, range: NSRange(location: 0, length: ns.length)).map { ns.substring(with: $0.range) }
    }

    static func ersetze(_ muster: NSRegularExpression, in text: String, durch: String) -> String {
        muster.stringByReplacingMatches(in: text, range: NSRange(location: 0, length: (text as NSString).length), withTemplate: durch)
    }

    /// Entfernt Datumsangaben und Füllwörter am Anfang, übrig bleibt die Bezeichnung.
    static func bereinige(_ zeile: String) -> String {
        var t = ersetze(datumMuster, in: zeile, durch: " ")
        for _ in 0..<3 {
            t = ersetze(fuellMuster, in: t, durch: "")
            t = ersetze(monatMuster, in: t.trimmingCharacters(in: .whitespaces), durch: "")
        }
        t = t.replacingOccurrences(of: #"\s{2,}"#, with: " ", options: .regularExpression)
        return t.trimmingCharacters(in: CharacterSet(charactersIn: " -–—:|,;/•·\t"))
    }
}
