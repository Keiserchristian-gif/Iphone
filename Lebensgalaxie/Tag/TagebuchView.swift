import LebensKern
import SwiftUI

/// Alle abgeschlossenen Tage zum Nachlesen, neueste zuerst, nach Monaten gegliedert und durchsuchbar.
struct TagebuchView: View {
    @Environment(AppModel.self) private var model
    @State private var suche = ""

    private struct Monat: Identifiable {
        let id: Date
        let tage: [Tag]
    }

    /// Treffer nach Text, Kurzfassung, Notizen und Bereichsnamen, gruppiert nach Monat.
    private var monate: [Monat] {
        let begriff = suche.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let kalender = Calendar.current
        let treffer = model.bestand.tage.filter { tag in
            guard !begriff.isEmpty else { return true }
            let heu = ([tag.text, tag.kurz] + tag.notizen.map(\.text) + tag.bereiche.map(\.titel)).joined(separator: " ").lowercased()
            return heu.contains(begriff)
        }
        let gruppen = Dictionary(grouping: treffer) { kalender.dateInterval(of: .month, for: $0.datum)?.start ?? $0.datum }
        return gruppen.keys.sorted(by: >).map { Monat(id: $0, tage: gruppen[$0]!.sorted { $0.datum > $1.datum }) }
    }

    var body: some View {
        List {
            if model.bestand.tage.isEmpty {
                Text("Noch kein abgeschlossener Tag. Halte in der Galaxie eine Notiz fest und schließe abends den Tag ab.")
                    .foregroundStyle(Stil.matt)
                    .listRowBackground(Stil.tafel)
            } else if monate.isEmpty {
                Text("Nichts gefunden für „\(suche)“.").foregroundStyle(Stil.matt).listRowBackground(Stil.tafel)
            }
            ForEach(monate) { monat in
                Section {
                    ForEach(monat.tage) { tag in
                        NavigationLink {
                            TagDetailView(tag: tag)
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: Stimmung.symbol(tag.stimmung)).foregroundStyle(Stil.gold).frame(width: 26)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(tag.datum, format: .dateTime.weekday(.wide).day().month(.wide))
                                        .font(.subheadline.weight(.semibold)).foregroundStyle(Stil.tinte)
                                    let zeile = tag.kurz.isEmpty ? tag.text : tag.kurz
                                    if !zeile.isEmpty { Text(zeile).font(.footnote).foregroundStyle(Stil.matt).lineLimit(2) }
                                }
                            }
                        }
                        .listRowBackground(Stil.tafel)
                    }
                    .onDelete { stellen in
                        let ids = stellen.map { monat.tage[$0].id }
                        model.aendere { $0.tage.removeAll { ids.contains($0.id) } }
                    }
                } header: {
                    Text(monat.id, format: .dateTime.month(.wide).year()).foregroundStyle(Stil.matt)
                }
            }
        }
        .raumHintergrund()
        .navigationTitle("Tagebuch")
        .searchable(text: $suche, prompt: "Suchen")
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
