import LebensKern
import SwiftUI

/// Kapitelübersicht des Fragebogens mit Fortschritt.
struct FragebogenView: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        List {
            Section {
                Text("Jede Frage ist freiwillig. Du kannst jederzeit aufhören und später weitermachen. Antworten mit Jahreszahl werden Sterne in deiner Galaxie.")
                    .font(.subheadline).foregroundStyle(Stil.matt)
                    .listRowBackground(Color.clear)
            }
            ForEach(FragebogenInhalt.kapitel) { kapitel in
                NavigationLink {
                    KapitelView(kapitel: kapitel)
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: kapitel.symbol).font(.title3).foregroundStyle(Stil.gold).frame(width: 30)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(kapitel.titel).foregroundStyle(Stil.tinte)
                            let beantwortet = kapitel.fragen.filter { model.bestand.antworten[$0.id] != nil }.count
                            ProgressView(value: model.bestand.fortschritt(kapitel)).tint(Stil.gold)
                            Text("\(beantwortet) von \(kapitel.fragen.count) beantwortet").font(.caption).foregroundStyle(Stil.matt)
                        }
                    }
                    .padding(.vertical, 4)
                }
                .listRowBackground(Stil.tafel)
            }
        }
        .raumHintergrund()
        .navigationTitle("Fragebogen")
    }
}

/// Die Fragen eines Kapitels. Gespeichert wird beim Verlassen und bei jedem Wechsel in den Hintergrund.
struct KapitelView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var phase
    let kapitel: Kapitel
    @State private var antworten: [String: Antwort] = [:]
    @State private var geladen = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 26) {
                Text(kapitel.einleitung).font(.subheadline).foregroundStyle(Stil.matt)
                ForEach(kapitel.fragen) { frage in
                    FrageView(frage: frage, antwort: Binding(
                        get: { antworten[frage.id] ?? Antwort() },
                        set: { antworten[frage.id] = $0 }))
                }
            }
            .padding(18)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Stil.raum.ignoresSafeArea())
        .navigationTitle(kapitel.titel)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            guard !geladen else { return }
            geladen = true
            for frage in kapitel.fragen { antworten[frage.id] = model.bestand.antworten[frage.id] ?? Antwort() }
        }
        .onDisappear(perform: speichere)
        .onChange(of: phase) { _, neu in if neu != .active { speichere() } }
    }

    private func speichere() {
        let geaendert = kapitel.fragen.filter { (antworten[$0.id] ?? Antwort()) != (model.bestand.antworten[$0.id] ?? Antwort()) }
        guard !geaendert.isEmpty, model.zustand == .offen else { return }
        model.aendere { bestand in
            for frage in geaendert { bestand.uebernehme(antworten[frage.id] ?? Antwort(), fuer: frage, heute: .now) }
        }
    }
}

struct FrageView: View {
    let frage: Frage
    @Binding var antwort: Antwort

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(frage.titel).font(.headline).foregroundStyle(Stil.tinte).fixedSize(horizontal: false, vertical: true)
            if !frage.hilfe.isEmpty { Text(frage.hilfe).font(.footnote).foregroundStyle(Stil.matt) }
            switch frage.art {
            case .text:
                TextField("Antwort", text: $antwort.text).feld()
            case .langtext:
                TextField("Antwort", text: $antwort.text, axis: .vertical).lineLimit(3...10).feld()
            case .eintraege(let vorlage):
                EintraegeView(vorlage: vorlage, eintraege: $antwort.eintraege)
            case .wahl(let moeglich):
                Fluss {
                    ForEach(moeglich, id: \.self) { wort in
                        Plaettchen(text: wort, gewaehlt: antwort.wahl.contains(wort)) {
                            if let i = antwort.wahl.firstIndex(of: wort) { antwort.wahl.remove(at: i) } else { antwort.wahl.append(wort) }
                        }
                    }
                }
            case .skala(let links, let rechts):
                VStack(spacing: 6) {
                    HStack(spacing: 10) {
                        ForEach(1...5, id: \.self) { stufe in
                            Button {
                                antwort.wert = antwort.wert == stufe ? 0 : stufe
                            } label: {
                                Text("\(stufe)").font(.headline).frame(maxWidth: .infinity).padding(.vertical, 11)
                                    .background(antwort.wert == stufe ? Stil.gold : Stil.tafel, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                                    .foregroundStyle(antwort.wert == stufe ? Stil.raum : Stil.tinte)
                            }
                            .buttonStyle(.plain)
                            .accessibilityAddTraits(antwort.wert == stufe ? .isSelected : [])
                        }
                    }
                    HStack { Text(links); Spacer(); Text(rechts) }.font(.caption).foregroundStyle(Stil.matt)
                }
            }
        }
    }
}

/// Liste von Zeilen mit Bezeichnung und Jahr, zum Beispiel Arbeitsstellen.
struct EintraegeView: View {
    let vorlage: EintragVorlage
    @Binding var eintraege: [Eintrag]

    var body: some View {
        VStack(spacing: 10) {
            ForEach($eintraege) { $eintrag in
                VStack(spacing: 8) {
                    HStack(spacing: 8) {
                        TextField(vorlage.platzhalter.isEmpty ? "Bezeichnung" : vorlage.platzhalter, text: $eintrag.titel)
                        Button {
                            eintraege.removeAll { $0.id == eintrag.id }
                        } label: { Image(systemName: "minus.circle").foregroundStyle(Stil.matt) }
                            .accessibilityLabel("Zeile entfernen")
                    }
                    HStack(spacing: 8) {
                        JahrFeld(titel: vorlage.mitBis ? "von Jahr" : "Jahr", jahr: $eintrag.jahr)
                        if vorlage.mitBis { JahrFeld(titel: "bis Jahr", jahr: $eintrag.bisJahr) }
                        Spacer(minLength: 0)
                    }
                    if vorlage.ereignis {
                        TextField("Was war daran wichtig? (freiwillig)", text: $eintrag.notiz, axis: .vertical).lineLimit(1...4).font(.subheadline)
                    }
                }
                .padding(12)
                .background(Stil.tafel, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                .foregroundStyle(Stil.tinte)
            }
            Button {
                eintraege.append(Eintrag())
            } label: {
                Label("Zeile hinzufügen", systemImage: "plus").font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity).padding(.vertical, 11)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Stil.linie, style: StrokeStyle(lineWidth: 1, dash: [5, 4])))
                    .foregroundStyle(Stil.gold)
            }
            .buttonStyle(.plain)
        }
    }
}

struct JahrFeld: View {
    let titel: String
    @Binding var jahr: Int?

    var body: some View {
        TextField(titel, text: Binding(
            get: { jahr.map(String.init) ?? "" },
            set: { jahr = Int($0.filter(\.isNumber).prefix(4)) }))
            .keyboardType(.numberPad)
            .frame(width: 96)
            .padding(.horizontal, 10).padding(.vertical, 7)
            .background(Stil.feld, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
    }
}

extension View {
    func feld() -> some View {
        padding(13)
            .background(Stil.tafel, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .foregroundStyle(Stil.tinte)
    }
}
