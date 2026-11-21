import LebensKern
import SwiftUI

/// Der Tagesabschluss. Soll in unter zwei Minuten gehen: Notizen ansehen, ein Satz dazu, eine Stimmung, fertig.
struct TagesabschlussView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.dismiss) private var schliessen
    let fertig: (_ text: String, _ stimmung: Int, _ bereiche: [Bereich], _ kurz: String) -> Void

    @State private var text = ""
    @State private var stimmung = 0
    @State private var bereiche: [Bereich] = []
    @State private var kurz = ""
    @State private var selbstGewaehlt = false
    @State private var deutet = false
    @State private var geladen = false

    private var notizen: [Notiz] { model.bestand.notizen(am: .now) + (model.bestand.tag(am: .now)?.notizen ?? []) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    if !notizen.isEmpty {
                        abschnitt("Deine Notizen von heute") {
                            VStack(alignment: .leading, spacing: 8) {
                                ForEach(notizen.sorted { $0.zeit < $1.zeit }) { notiz in
                                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                                        Text(notiz.zeit, format: .dateTime.hour().minute()).font(.footnote.monospacedDigit()).foregroundStyle(Stil.matt)
                                        Text(notiz.text).foregroundStyle(Stil.tinte)
                                    }
                                }
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(14)
                            .background(Stil.tafel, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                        }
                    }
                    abschnitt("Wie war dein Tag?") {
                        TextField("Schreib, so viel oder wenig du magst", text: $text, axis: .vertical)
                            .lineLimit(4...12)
                            .padding(14)
                            .background(Stil.tafel, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                            .foregroundStyle(Stil.tinte)
                    }
                    abschnitt("Stimmung") {
                        HStack(spacing: 8) {
                            ForEach(1...5, id: \.self) { stufe in
                                Button {
                                    stimmung = stimmung == stufe ? 0 : stufe
                                } label: {
                                    VStack(spacing: 6) {
                                        Image(systemName: Stimmung.symbol(stufe)).font(.title3).frame(height: 28)
                                        Text(Stimmung.wort(stufe)).font(.caption2)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 10)
                                    .background(stimmung == stufe ? Stil.gold : Stil.tafel, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                                    .foregroundStyle(stimmung == stufe ? Stil.raum : Stil.tinte)
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Stimmung \(Stimmung.wort(stufe))")
                                .accessibilityAddTraits(stimmung == stufe ? .isSelected : [])
                            }
                        }
                    }
                    abschnitt("Worum ging es?") {
                        Fluss {
                            ForEach(Bereich.allCases) { bereich in
                                Plaettchen(text: bereich.titel, farbe: bereich.farbe, gewaehlt: bereiche.contains(bereich)) {
                                    selbstGewaehlt = true
                                    if let i = bereiche.firstIndex(of: bereich) { bereiche.remove(at: i) } else { bereiche.append(bereich) }
                                }
                            }
                        }
                        Text(deutet ? "Die App liest deinen Eintrag …" : "Vorschlag der App. Tippe, um ihn zu ändern.")
                            .font(.footnote).foregroundStyle(Stil.matt)
                    }
                    Button("Abschließen") { Task { await schliesseAb() } }
                        .buttonStyle(Hauptknopf())
                        .disabled(deutet)
                }
                .padding(18)
            }
            .scrollDismissesKeyboard(.interactively)
            .background(Stil.raum.ignoresSafeArea())
            .navigationTitle("Tag abschließen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { schliessen() } } }
            .task {
                guard !geladen else { return }
                geladen = true
                if let tag = model.bestand.tag(am: .now) {
                    text = tag.text
                    stimmung = tag.stimmung
                    bereiche = tag.bereiche
                    selbstGewaehlt = !tag.bereiche.isEmpty
                }
                await deute()
            }
        }
        .presentationDetents([.large])
    }

    private func abschnitt<Inhalt: View>(_ titel: String, @ViewBuilder inhalt: () -> Inhalt) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(titel).font(.headline).foregroundStyle(Stil.tinte)
            inhalt()
        }
    }

    private func deute() async {
        deutet = true
        let ergebnis = await Auswertung.deuteTag(notizen: notizen.map(\.text), text: text)
        if !selbstGewaehlt { bereiche = ergebnis.bereiche }
        kurz = ergebnis.kurz
        deutet = false
    }

    private func schliesseAb() async {
        // Der Text kann sich seit dem ersten Vorschlag geändert haben.
        await deute()
        fertig(text, stimmung, bereiche, kurz)
        schliessen()
    }
}
