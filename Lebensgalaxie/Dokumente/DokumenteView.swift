import LebensKern
import SwiftUI
import UniformTypeIdentifiers

/// Dokumente einlesen: Text erkennen, Stationen vorschlagen, einzeln bestätigen.
struct DokumenteView: View {
    @Environment(AppModel.self) private var model
    @State private var waehltDatei = false
    @State private var stand: String?
    @State private var fehler: String?
    @State private var pruefung: Pruefung?
    @State private var zuLoeschen: Dokument?

    struct Pruefung: Identifiable {
        let id = UUID()
        var name: String
        var text: String
        var original: Data
        var stationen: [Station]
    }

    var body: some View {
        List {
            Section {
                Text("Wähle einen Lebenslauf oder eine andere Unterlage als PDF, Foto oder Textdatei. Die App liest den Text auf dem iPhone und schlägt Stationen vor. Nichts wird eingetragen, bevor du es bestätigst.")
                    .font(.subheadline).foregroundStyle(Stil.matt).listRowBackground(Color.clear)
                Button {
                    fehler = nil
                    waehltDatei = true
                } label: {
                    Label(stand ?? "Dokument einlesen", systemImage: stand == nil ? "doc.badge.plus" : "hourglass")
                }
                .disabled(stand != nil)
                .listRowBackground(Stil.tafel)
                if let fehler { Text(fehler).font(.footnote).foregroundStyle(Stil.warnung).listRowBackground(Stil.tafel) }
            }
            if !model.bestand.dokumente.isEmpty {
                Section("Eingelesen") {
                    ForEach(model.bestand.dokumente) { dokument in
                        VStack(alignment: .leading, spacing: 3) {
                            Text(dokument.name).foregroundStyle(Stil.tinte)
                            let sterne = model.bestand.ereignisse.filter { $0.quelle == dokument.id.uuidString }.count
                            Text("\(Text(dokument.datum, format: .dateTime.day().month().year())), \(sterne) \(sterne == 1 ? "Stern" : "Sterne")")
                                .font(.footnote).foregroundStyle(Stil.matt)
                        }
                        .swipeActions { Button("Löschen", role: .destructive) { zuLoeschen = dokument } }
                        .listRowBackground(Stil.tafel)
                    }
                }
            }
        }
        .raumHintergrund()
        .navigationTitle("Dokumente")
        .fileImporter(isPresented: $waehltDatei, allowedContentTypes: [.pdf, .image, .plainText]) { ergebnis in
            guard case .success(let url) = ergebnis else { return }
            Task { await liesEin(url) }
        }
        .sheet(item: $pruefung) { p in
            StationenPruefenView(pruefung: p) { gewaehlt in uebernehme(p, gewaehlt) }
        }
        .confirmationDialog("Dokument löschen?", isPresented: Binding(get: { zuLoeschen != nil }, set: { if !$0 { zuLoeschen = nil } }), titleVisibility: .visible) {
            Button("Dokument und seine Sterne löschen", role: .destructive) { if let d = zuLoeschen { model.loesche(dokument: d, mitSternen: true) } }
            Button("Nur das Dokument löschen") { if let d = zuLoeschen { model.loesche(dokument: d, mitSternen: false) } }
            Button("Abbrechen", role: .cancel) {}
        }
    }

    private func liesEin(_ url: URL) async {
        stand = "Text wird gelesen …"
        defer { stand = nil }
        do {
            let gelesen = try await Texterkennung.lies(url: url)
            stand = "Stationen werden erkannt …"
            let jahr = Calendar.current.component(.year, from: .now)
            let stationen = await Auswertung.stationen(aus: gelesen.text, heute: jahr)
            pruefung = Pruefung(name: url.lastPathComponent, text: gelesen.text, original: gelesen.original, stationen: stationen)
        } catch {
            fehler = (error as? LocalizedError)?.errorDescription ?? "Das Dokument konnte nicht gelesen werden."
        }
    }

    private func uebernehme(_ p: Pruefung, _ gewaehlt: [Station]) {
        let dokument = Dokument(name: p.name, datum: .now, text: p.text, datei: model.bewahreOriginal(p.original))
        model.aendere { bestand in
            bestand.dokumente.append(dokument)
            for station in gewaehlt {
                var text = ""
                if station.laufend { text = "Dauert an." } else if let bis = station.bisJahr { text = "Bis \(bis)." }
                bestand.ereignisse.append(Ereignis(titel: station.titel, datum: Zeit.datum(jahr: station.jahr), bereich: station.bereich,
                                                   gewicht: 2, text: text, herkunft: .dokument, quelle: dokument.id.uuidString))
            }
        }
    }
}

/// Jede erkannte Station lässt sich abwählen und korrigieren, bevor sie ein Stern wird.
struct StationenPruefenView: View {
    @Environment(\.dismiss) private var schliessen
    let pruefung: DokumenteView.Pruefung
    let fertig: ([Station]) -> Void
    @State private var stationen: [Station] = []
    @State private var abgewaehlt: Set<UUID> = []

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text(stationen.isEmpty
                         ? "Im Text wurden keine Stationen mit Jahreszahl gefunden. Das Dokument wird trotzdem verschlüsselt aufbewahrt."
                         : "Prüfe, was die App erkannt hat. Tippe auf den Haken, um eine Station wegzulassen.")
                        .font(.subheadline).foregroundStyle(Stil.matt).listRowBackground(Color.clear)
                }
                ForEach($stationen) { $station in
                    let dabei = !abgewaehlt.contains(station.id)
                    HStack(alignment: .top, spacing: 12) {
                        Button {
                            if dabei { abgewaehlt.insert(station.id) } else { abgewaehlt.remove(station.id) }
                        } label: {
                            Image(systemName: dabei ? "checkmark.circle.fill" : "circle").font(.title3).foregroundStyle(dabei ? Stil.gold : Stil.matt)
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(dabei ? "Station weglassen" : "Station übernehmen")
                        VStack(alignment: .leading, spacing: 8) {
                            TextField("Bezeichnung", text: $station.titel, axis: .vertical).foregroundStyle(Stil.tinte)
                            HStack(spacing: 8) {
                                JahrFeld(titel: "Jahr", jahr: Binding(get: { station.jahr }, set: { station.jahr = $0 ?? station.jahr }))
                                Picker("Bereich", selection: $station.bereich) {
                                    ForEach(Bereich.allCases) { Text($0.titel).tag($0) }
                                }
                                .labelsHidden()
                            }
                        }
                        .opacity(dabei ? 1 : 0.4)
                    }
                    .listRowBackground(Stil.tafel)
                }
            }
            .raumHintergrund()
            .navigationTitle(pruefung.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Verwerfen") { schliessen() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Übernehmen") {
                        fertig(stationen.filter { !abgewaehlt.contains($0.id) && !$0.titel.trimmingCharacters(in: .whitespaces).isEmpty })
                        schliessen()
                    }
                }
            }
            .onAppear { if stationen.isEmpty { stationen = pruefung.stationen } }
        }
    }
}
