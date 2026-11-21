import LebensKern
import SwiftUI

/// Alle abgeschlossenen Tage zum Nachlesen, neueste zuerst.
struct TagebuchView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        List {
            if model.bestand.tage.isEmpty {
                Text("Noch kein abgeschlossener Tag. Halte in der Galaxie eine Notiz fest und schließe abends den Tag ab.")
                    .foregroundStyle(Stil.matt)
                    .listRowBackground(Stil.tafel)
            }
            ForEach(Array(model.bestand.tage.reversed())) { tag in
                NavigationLink {
                    TagDetailView(tag: tag)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: Stimmung.symbol(tag.stimmung)).foregroundStyle(Stil.gold).frame(width: 26)
                        VStack(alignment: .leading, spacing: 3) {
                            Text(tag.datum, format: .dateTime.weekday(.wide).day().month(.wide).year())
                                .font(.subheadline.weight(.semibold)).foregroundStyle(Stil.tinte)
                            let zeile = tag.kurz.isEmpty ? tag.text : tag.kurz
                            if !zeile.isEmpty { Text(zeile).font(.footnote).foregroundStyle(Stil.matt).lineLimit(2) }
                        }
                    }
                }
                .listRowBackground(Stil.tafel)
            }
            .onDelete { stellen in
                let liste = Array(model.bestand.tage.reversed())
                let ids = stellen.map { liste[$0].id }
                model.aendere { $0.tage.removeAll { ids.contains($0.id) } }
            }
        }
        .raumHintergrund()
        .navigationTitle("Tagebuch")
    }
}

struct TagDetailView: View {
    let tag: Tag

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack(spacing: 10) {
                    Image(systemName: Stimmung.symbol(tag.stimmung)).foregroundStyle(Stil.gold)
                    Text("Stimmung: \(Stimmung.wort(tag.stimmung))").foregroundStyle(Stil.tinte)
                }
                if !tag.bereiche.isEmpty {
                    Fluss {
                        ForEach(tag.bereiche) { bereich in
                            Text(bereich.titel).font(.footnote.weight(.medium)).padding(.horizontal, 11).padding(.vertical, 6)
                                .background(bereich.farbe, in: Capsule()).foregroundStyle(Stil.raum)
                        }
                    }
                }
                if !tag.text.isEmpty { Text(tag.text).foregroundStyle(Stil.tinte) }
                if !tag.notizen.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Notizen").font(.headline).foregroundStyle(Stil.tinte)
                        ForEach(tag.notizen) { notiz in
                            HStack(alignment: .firstTextBaseline, spacing: 10) {
                                Text(notiz.zeit, format: .dateTime.hour().minute()).font(.footnote.monospacedDigit()).foregroundStyle(Stil.matt)
                                Text(notiz.text).foregroundStyle(Stil.tinte)
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
        }
        .background(Stil.raum.ignoresSafeArea())
        .navigationTitle(Text(tag.datum, format: .dateTime.day().month(.wide).year()))
        .navigationBarTitleDisplayMode(.inline)
    }
}
