import Foundation

extension Bestand {
    /// Ein erfundenes Leben für Vorschau und Tests. Enthält keine echten Daten.
    public static func beispiel(heute: Date, kalender: Calendar = .current) -> Bestand {
        let jahr = Zeit.jahr(heute, kalender: Zeit.fest)
        func e(_ titel: String, _ vor: Int, _ bereich: Bereich, _ gewicht: Int, _ text: String = "") -> Ereignis {
            Ereignis(titel: titel, datum: Zeit.datum(jahr: jahr - vor), bereich: bereich, gewicht: gewicht, text: text, herkunft: .fragebogen)
        }
        var b = Bestand(profil: Profil(rufname: "Alex", geburt: Zeit.datum(jahr: jahr - 31, monat: 3, tag: 14)))
        b.ereignisse = [
            e("Einschulung", 25, .arbeit, 1),
            e("Fußballverein", 21, .gesundheit, 1),
            e("Umzug aufs Land", 19, .menschen, 2, "Neue Schule, neue Freunde."),
            e("Jonas kennengelernt", 14, .menschen, 3, "Seitdem der, den du in schweren Wochen anrufst."),
            e("Realschulabschluss", 15, .arbeit, 2),
            e("Lehrstelle", 10, .arbeit, 2, "Der Tipp kam von Jonas."),
            e("Gesellenbrief", 7, .arbeit, 3, "Drei Jahre Lehre, und fertig geworden."),
            e("Erstes eigenes Gehalt", 7, .geld, 1),
            e("Erste eigene Wohnung", 4, .geld, 3, "Kam direkt nach einer Dunkelwolke."),
            e("Lauftreff", 3, .gesundheit, 2),
            e("Jobwechsel", 2, .arbeit, 2),
            e("Norwegen allein", 1, .traeume, 3, "Dort entstand die Idee mit der eigenen Werkstatt."),
        ]
        b.phasen = [
            Phase(name: "Nach der Trennung", beginn: Zeit.datum(jahr: jahr - 5, monat: 2, tag: 1), ende: Zeit.datum(jahr: jahr - 5, monat: 3, tag: 8)),
            Phase(name: "Ausgebrannt", beginn: Zeit.datum(jahr: jahr - 3, monat: 9, tag: 1), ende: Zeit.datum(jahr: jahr - 3, monat: 11, tag: 3)),
            Phase(name: "Jobsuche", beginn: heute.addingTimeInterval(-42 * 86_400)),
        ]
        b.monde = [
            Mond(name: "Jonas", bereich: .menschen, art: .mensch), Mond(name: "Mama", bereich: .menschen, art: .mensch),
            Mond(name: "Lauftreff", bereich: .menschen, art: .vorhaben), Mond(name: "Bewerbungen", bereich: .arbeit, art: .vorhaben),
            Mond(name: "Laufen", bereich: .gesundheit, art: .vorhaben), Mond(name: "Kochen", bereich: .gesundheit, art: .vorhaben),
            Mond(name: "Notgroschen", bereich: .geld, art: .ziel), Mond(name: "Eigene Werkstatt", bereich: .traeume, art: .ziel),
        ]
        let texte: [(String, Int, [Bereich])] = [
            ("Bewerbung abgeschickt, danach lange spazieren.", 3, [.arbeit, .gesundheit]),
            ("Absage bekommen. Abends mit Jonas telefoniert.", 2, [.arbeit, .menschen]),
            ("Zehn Kilometer mit dem Lauftreff.", 4, [.gesundheit, .menschen]),
            ("Vorstellungsgespräch lief zäh.", 2, [.arbeit]),
            ("Mit Mama gekocht.", 4, [.menschen, .gesundheit]),
            ("Skizzen für die Werkstatt gemacht.", 4, [.traeume]),
            ("Noch eine Absage.", 1, [.arbeit]),
            ("Konto geprüft, es reicht noch drei Monate.", 3, [.geld]),
        ]
        for (i, eintrag) in texte.enumerated() {
            let datum = kalender.startOfDay(for: heute.addingTimeInterval(Double(-(i + 1) * 3) * 86_400))
            b.tage.append(Tag(datum: datum, text: eintrag.0, stimmung: eintrag.1, bereiche: eintrag.2, kurz: eintrag.0))
        }
        b.tage.sort { $0.datum < $1.datum }
        let beginn = kalender.startOfDay(for: heute)
        b.notizen = [
            Notiz(zeit: beginn.addingTimeInterval(8 * 3600 + 600), text: "Schlecht geschlafen"),
            Notiz(zeit: beginn.addingTimeInterval(13 * 3600 + 1800), text: "Absage von der Tischlerei"),
            Notiz(zeit: beginn.addingTimeInterval(18 * 3600 + 2700), text: "30 Minuten gelaufen"),
        ]
        b.antworten[FragebogenInhalt.briefFrage] = Antwort(text: "Du bist aus jeder Wolke wieder herausgekommen.")
        return b
    }
}
