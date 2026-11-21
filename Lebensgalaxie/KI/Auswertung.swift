import Foundation
import LebensKern
#if canImport(FoundationModels)
import FoundationModels
#endif

struct TagesDeutung {
    var bereiche: [Bereich]
    var kurz: String
}

#if canImport(FoundationModels)
@Generable(description: "Auswertung eines persönlichen Tagebucheintrags")
struct KITag {
    @Guide(description: "Ein kurzer deutscher Satz in der Du-Form, der den Tag sachlich zusammenfasst, höchstens 12 Wörter")
    var kurz: String
    @Guide(description: "Ein bis drei Lebensbereiche, um die es geht. Erlaubt sind nur: menschen, arbeit, gesundheit, geld, traeume")
    var bereiche: [String]
}

@Generable(description: "Eine Station aus einem Lebenslauf oder ähnlichen Dokument")
struct KIStation {
    @Guide(description: "Kurze deutsche Bezeichnung der Station, zum Beispiel Ausbildung zum Tischler bei Tischlerei Brandt")
    var titel: String
    @Guide(description: "Jahr des Beginns, vierstellig")
    var jahr: Int
    @Guide(description: "Jahr des Endes, vierstellig. 0, wenn es noch andauert oder kein Ende genannt ist")
    var bisJahr: Int
    @Guide(description: "Der passende Lebensbereich. Erlaubt sind nur: menschen, arbeit, gesundheit, geld, traeume")
    var bereich: String
}

@Generable(description: "Alle Stationen, die im Text mit einer Jahreszahl genannt werden")
struct KIStationen {
    var stationen: [KIStation]
}
#endif

/// Auswertung auf dem Gerät. Nutzt Apples Sprachmodell, wenn es bereit ist, sonst die Stichwort-Zuordnung.
/// Kein Text verlässt dabei das iPhone.
enum Auswertung {
    static var kiVerfuegbar: Bool {
        #if canImport(FoundationModels)
        if case .available = SystemLanguageModel.default.availability { return true }
        #endif
        return false
    }

    static var kiStand: String {
        #if canImport(FoundationModels)
        switch SystemLanguageModel.default.availability {
        case .available:
            return "Das Sprachmodell des iPhones ist bereit. Einträge und Dokumente werden auf dem Gerät ausgewertet."
        case .unavailable(.appleIntelligenceNotEnabled):
            return "Apple Intelligence ist ausgeschaltet. Schalte es in den iPhone-Einstellungen ein, damit die App Einträge selbst auswerten kann. Bis dahin ordnet sie nach Stichwörtern zu."
        case .unavailable(.modelNotReady):
            return "Das Sprachmodell wird noch geladen. Bis es bereit ist, ordnet die App nach Stichwörtern zu."
        case .unavailable(.deviceNotEligible):
            return "Dieses Gerät unterstützt das Sprachmodell nicht. Die App ordnet nach Stichwörtern zu."
        case .unavailable:
            return "Das Sprachmodell ist gerade nicht verfügbar. Die App ordnet nach Stichwörtern zu."
        }
        #else
        return "Die App ordnet nach Stichwörtern zu."
        #endif
    }

    /// Ordnet einen Tag den Lebensbereichen zu und fasst ihn in einem Satz zusammen.
    static func deuteTag(notizen: [String], text: String) async -> TagesDeutung {
        let alles = (notizen + [text]).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: ". ")
        let einfach = TagesDeutung(bereiche: Zuordnung.bereiche(fuer: alles), kurz: Zuordnung.kurzfassung(alles))
        guard !alles.isEmpty else { return einfach }
        #if canImport(FoundationModels)
        guard kiVerfuegbar else { return einfach }
        do {
            let sitzung = LanguageModelSession(instructions: """
                Du hilfst, ein privates Tagebuch zu ordnen. Antworte auf Deutsch. \
                Bewerte nicht und gib keine Ratschläge. Fasse nur zusammen, was im Eintrag steht.
                """)
            let antwort = try await sitzung.respond(to: "Tagebucheintrag:\n\(String(alles.prefix(2400)))", generating: KITag.self)
            let bereiche = antwort.content.bereiche.compactMap { Bereich(rawValue: $0.lowercased()) }
            var eindeutig: [Bereich] = []
            for b in bereiche where !eindeutig.contains(b) { eindeutig.append(b) }
            let kurz = antwort.content.kurz.trimmingCharacters(in: .whitespacesAndNewlines)
            return TagesDeutung(bereiche: eindeutig.isEmpty ? einfach.bereiche : Array(eindeutig.prefix(3)),
                                kurz: kurz.isEmpty ? einfach.kurz : Zuordnung.kurzfassung(kurz, max: 120))
        } catch {
            return einfach
        }
        #else
        return einfach
        #endif
    }

    /// Liest Stationen aus Dokumenttext. Das Sprachmodell bekommt den Text in Stücken, die Zeilenerkennung ergänzt.
    static func stationen(aus text: String, heute: Int) async -> [Station] {
        let ausZeilen = Stationen.erkenne(in: text, heute: heute)
        #if canImport(FoundationModels)
        guard kiVerfuegbar else { return ausZeilen }
        var gefunden: [Station] = []
        for stueck in Stationen.stuecke(text, laenge: 1800).prefix(8) {
            do {
                let sitzung = LanguageModelSession(instructions: """
                    Du liest Stationen aus Lebensläufen und ähnlichen Dokumenten. Antworte auf Deutsch. \
                    Nimm nur Stationen auf, die im Text mit einer Jahreszahl stehen. Erfinde nichts. \
                    Geburtsdatum, Adresse und Telefonnummern sind keine Stationen.
                    """)
                let antwort = try await sitzung.respond(to: "Text:\n\(stueck)", generating: KIStationen.self)
                for s in antwort.content.stationen {
                    let titel = s.titel.trimmingCharacters(in: .whitespacesAndNewlines)
                    guard titel.count >= 3, (1940...heute + 1).contains(s.jahr) else { continue }
                    let bis = (s.bisJahr >= s.jahr && s.bisJahr <= heute + 1 && s.bisJahr != s.jahr) ? s.bisJahr : nil
                    gefunden.append(Station(titel: String(titel.prefix(80)), jahr: s.jahr, bisJahr: bis,
                                            bereich: Bereich(rawValue: s.bereich.lowercased()) ?? .arbeit,
                                            laufend: s.bisJahr == 0))
                }
            } catch {
                continue
            }
        }
        guard !gefunden.isEmpty else { return ausZeilen }
        // Was die Zeilenerkennung zusätzlich gefunden hat, wird angehängt, wenn das Jahr noch nicht vorkommt.
        let jahre = Set(gefunden.map(\.jahr))
        gefunden += ausZeilen.filter { !jahre.contains($0.jahr) }
        return Array(gefunden.sorted { $0.jahr < $1.jahr }.prefix(Stationen.hoechstens))
        #else
        return ausZeilen
        #endif
    }
}
