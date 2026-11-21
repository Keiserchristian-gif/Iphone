import Foundation

extension Bestand {
    /// Hält eine Notiz fest. Leere Texte werden ignoriert.
    public mutating func notiere(_ text: String, am zeit: Date) {
        let sauber = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !sauber.isEmpty else { return }
        notizen.append(Notiz(zeit: zeit, text: sauber))
    }

    /// Offene Notizen eines Tages, älteste zuerst.
    public func notizen(am tag: Date, kalender: Calendar = .current) -> [Notiz] {
        notizen.filter { kalender.isDate($0.zeit, inSameDayAs: tag) }.sorted { $0.zeit < $1.zeit }
    }

    public func tag(am datum: Date, kalender: Calendar = .current) -> Tag? {
        tage.first { kalender.isDate($0.datum, inSameDayAs: datum) }
    }

    /// Macht aus den offenen Notizen eines Tages einen Tag. Gibt es den Tag schon, wird er ergänzt und nicht verdoppelt.
    @discardableResult
    public mutating func schliesseTag(am datum: Date, text: String, stimmung: Int, bereiche: [Bereich], kurz: String,
                                      kalender: Calendar = .current) -> Tag {
        let offene = notizen(am: datum, kalender: kalender)
        notizen.removeAll { kalender.isDate($0.zeit, inSameDayAs: datum) }
        let sauber = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let stufe = min(5, max(0, stimmung))

        if let i = tage.firstIndex(where: { kalender.isDate($0.datum, inSameDayAs: datum) }) {
            var alt = tage[i]
            let bekannt = Set(alt.notizen.map(\.id))
            alt.notizen += offene.filter { !bekannt.contains($0.id) }
            alt.text = sauber
            alt.stimmung = stufe
            alt.bereiche = bereiche
            alt.kurz = kurz
            tage[i] = alt
            return alt
        }
        let neu = Tag(datum: kalender.startOfDay(for: datum), notizen: offene, text: sauber, stimmung: stufe,
                      bereiche: bereiche, kurz: kurz)
        tage.append(neu)
        tage.sort { $0.datum < $1.datum }
        return neu
    }

    /// Notizen von früheren Tagen, die nie abgeschlossen wurden, werden still zu Tagen ohne Stimmung.
    public mutating func raeumeAuf(heute: Date, kalender: Calendar = .current) {
        let grenze = kalender.startOfDay(for: heute)
        let alte = Set(notizen.filter { $0.zeit < grenze }.map { kalender.startOfDay(for: $0.zeit) })
        for tagBeginn in alte.sorted() {
            let texte = notizen(am: tagBeginn, kalender: kalender).map(\.text).joined(separator: ". ")
            let vorhanden = tag(am: tagBeginn, kalender: kalender)
            schliesseTag(am: tagBeginn,
                         text: vorhanden?.text ?? "",
                         stimmung: vorhanden?.stimmung ?? 0,
                         bereiche: vorhanden?.bereiche ?? Zuordnung.bereiche(fuer: texte),
                         kurz: vorhanden?.kurz ?? Zuordnung.kurzfassung(texte),
                         kalender: kalender)
        }
    }
}
