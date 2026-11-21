import LebensKern
import SwiftUI

/// Die Karte über dem Notizfeld. Zeigt den Überblick oder das, was in der Szene angetippt wurde.
struct DetailKarte: View {
    @Environment(AppModel.self) private var model
    let auswahl: Auswahl?
    let schliessen: () -> Void

    var body: some View {
        let szene = model.szene
        VStack(alignment: .leading, spacing: 6) {
            switch auswahl?.art {
            case "stern", "tag":
                if let stern = szene.sterne.first(where: { $0.id == auswahl?.id }) {
                    kopf(stern.jahr.isEmpty ? stern.name : "\(stern.name), \(stern.jahr)", farbe: Bereich(rawValue: stern.bereich)?.farbe ?? Stil.tinte)
                    if !stern.text.isEmpty { text(stern.text) }
                    if let bereich = Bereich(rawValue: stern.bereich) { klein(bereich.titel) }
                }
            case "wolke":
                if let wolke = szene.wolken.first(where: { $0.id == auswahl?.id }) {
                    kopf(wolke.name, farbe: Stil.matt, symbol: "cloud.fill")
                    text(wolke.text)
                }
            case "planet":
                if let planet = szene.planeten.first(where: { $0.bereich == auswahl?.id }) {
                    kopf(planet.name, farbe: Bereich(rawValue: planet.bereich)?.farbe ?? Stil.tinte)
                    text(planet.text)
                    if !planet.monde.isEmpty { klein("Monde: " + planet.monde.map(\.name).joined(separator: ", ")) }
                }
            case "mond":
                if let mond = model.bestand.monde.first(where: { $0.id.uuidString == auswahl?.id }) {
                    kopf(mond.name, farbe: mond.bereich.farbe, symbol: "moon.fill")
                    klein("\(mond.art.titel), kreist um \(mond.bereich.titel)")
                }
            case "heute":
                heute
            case "geburt":
                kopf("Geburt, \(String(szene.geburtsjahr))", farbe: Stil.gold)
                text("Hier beginnt die Spirale. Jede Umdrehung nach außen ist ein Jahrzehnt.")
            case "sonne":
                kopf(szene.rufname.isEmpty ? "Du" : szene.rufname, farbe: Stil.gold, symbol: "sun.max.fill")
                text("Um dich kreisen deine fünf Lebensbereiche. Ein Sturm auf einem Planeten heißt nicht, dass das ganze System stillsteht.")
            default:
                kopf("Von außen betrachtet", farbe: nil)
                text(szene.ueberblick.isEmpty ? "Tippe einen Stern an." : szene.ueberblick)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 15).padding(.vertical, 12)
        .tafel()
        .overlay(alignment: .topTrailing) {
            if auswahl != nil {
                Button(action: schliessen) {
                    Image(systemName: "xmark").font(.caption.weight(.bold)).foregroundStyle(Stil.matt).frame(width: 40, height: 40)
                }
                .accessibilityLabel("Schließen")
            }
        }
    }

    @ViewBuilder private var heute: some View {
        let notizen = model.bestand.notizen(am: .now)
        if let tag = model.bestand.tag(am: .now), notizen.isEmpty {
            kopf("Heute ist ein Stern", farbe: Stil.gold)
            text(tag.kurz.isEmpty ? "Der Tag ist abgeschlossen." : tag.kurz)
        } else if notizen.isEmpty {
            kopf("Heute", farbe: Stil.tinte)
            text("Noch keine Notiz. Halte unten fest, was gerade ist. Abends wird daraus ein Stern.")
        } else {
            kopf("Heute, \(notizen.count) \(notizen.count == 1 ? "Notiz" : "Notizen")", farbe: Stil.tinte)
            ForEach(notizen.suffix(4)) { notiz in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(notiz.zeit, format: .dateTime.hour().minute()).font(.footnote.monospacedDigit()).foregroundStyle(Stil.matt)
                    Text(notiz.text).font(.subheadline).foregroundStyle(Stil.tinte)
                }
            }
        }
    }

    private func kopf(_ titel: String, farbe: Color?, symbol: String? = nil) -> some View {
        HStack(spacing: 8) {
            if let symbol {
                Image(systemName: symbol).font(.footnote).foregroundStyle(farbe ?? Stil.tinte)
            } else if let farbe {
                Circle().fill(farbe).frame(width: 9, height: 9)
            }
            Text(titel).font(.subheadline.weight(.semibold)).foregroundStyle(Stil.tinte)
        }
        .padding(.trailing, 28)
    }

    private func text(_ inhalt: String) -> some View {
        Text(inhalt).font(.subheadline).foregroundStyle(Stil.tinte).fixedSize(horizontal: false, vertical: true)
    }

    private func klein(_ inhalt: String) -> some View {
        Text(inhalt).font(.footnote).foregroundStyle(Stil.matt)
    }
}
