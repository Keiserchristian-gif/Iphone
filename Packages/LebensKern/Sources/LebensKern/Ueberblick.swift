import Foundation

/// Die Sätze, die das Leben von oben beschreiben.
public enum Ueberblick {
    static let ordnung = ["ersten", "zweiten", "dritten", "vierten", "fünften", "sechsten", "siebten", "achten",
                          "neunten", "zehnten", "elften", "zwölften"]
    static let zahl = ["Null", "Eine", "Zwei", "Drei", "Vier", "Fünf", "Sechs", "Sieben", "Acht", "Neun", "Zehn"]

    /// "9 Wochen", "3 Tage", "14 Monate", "2 Jahre"
    public static func dauer(von: Date, bis: Date) -> String {
        let tage = max(1, Int((bis.timeIntervalSince(von) / 86_400).rounded()))
        if tage < 14 { return tage == 1 ? "1 Tag" : "\(tage) Tage" }
        if tage < 70 { return "\(Int((Double(tage) / 7).rounded())) Wochen" }
        if tage < 730 { return "\(Int((Double(tage) / 30.44).rounded())) Monate" }
        return "\(Int((Double(tage) / 365.25).rounded())) Jahre"
    }

    public static func text(_ bestand: Bestand, heute: Date) -> String {
        var saetze: [String] = []
        if let profil = bestand.profil {
            let umdrehung = min(ordnung.count - 1, Int(Zeit.alter(geburt: profil.geburt, am: heute) / 10))
            saetze.append("Du bist in deiner \(ordnung[umdrehung]) Umdrehung.")
        }
        let vorbei = bestand.phasen.filter { ($0.ende ?? heute) < heute && $0.ende != nil }
        if vorbei.count == 1 {
            saetze.append("Eine Dunkelwolke liegt schon hinter dir.")
        } else if vorbei.count > 1 {
            let laengste = vorbei.max { ($0.ende ?? heute).timeIntervalSince($0.beginn) < ($1.ende ?? heute).timeIntervalSince($1.beginn) }
            let anzahl = vorbei.count < zahl.count ? zahl[vorbei.count] : "\(vorbei.count)"
            var satz = "\(anzahl) Dunkelwolken liegen schon hinter dir"
            if let laengste, let ende = laengste.ende { satz += ", die längste dauerte \(dauer(von: laengste.beginn, bis: ende))" }
            saetze.append(satz + ".")
        }
        if let offen = bestand.phasen.last(where: { $0.ende == nil && $0.beginn <= heute }) {
            saetze.append("Die jetzige ist \(dauer(von: offen.beginn, bis: heute)) alt.")
        }
        if bestand.ereignisse.isEmpty && bestand.tage.isEmpty {
            saetze.append("Noch ist deine Galaxie fast leer. Der Fragebogen füllt sie mit deiner Vergangenheit.")
        }
        return saetze.joined(separator: " ")
    }
}
