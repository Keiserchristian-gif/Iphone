import Foundation

public enum Zeit {
    static let jahrInSekunden = 365.2425 * 86_400.0

    /// Fester Kalender für Daten, von denen nur das Jahr bekannt ist.
    public static let fest: Calendar = {
        var k = Calendar(identifier: .gregorian)
        k.timeZone = TimeZone(identifier: "UTC") ?? .gmt
        return k
    }()

    /// Alter in Jahren mit Nachkommastellen, nie negativ.
    public static func alter(geburt: Date, am: Date) -> Double {
        max(0, am.timeIntervalSince(geburt) / jahrInSekunden)
    }

    /// Ein Datum zur Mittagszeit, damit es in keiner Zeitzone auf den Nachbartag rutscht.
    public static func datum(jahr: Int, monat: Int = 7, tag: Int = 1) -> Date {
        fest.date(from: DateComponents(year: jahr, month: monat, day: tag, hour: 12)) ?? Date(timeIntervalSince1970: 0)
    }

    public static func jahr(_ datum: Date, kalender: Calendar = .current) -> Int {
        kalender.component(.year, from: datum)
    }

    /// "21.11.2026"
    public static func kurz(_ datum: Date, kalender: Calendar = .current) -> String {
        let c = kalender.dateComponents([.day, .month, .year], from: datum)
        return "\(c.day ?? 0).\(c.month ?? 0).\(c.year ?? 0)"
    }
}
