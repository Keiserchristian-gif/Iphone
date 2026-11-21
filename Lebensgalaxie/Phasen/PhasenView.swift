import LebensKern
import SwiftUI

/// Schwere Phasen anlegen und beenden. Jede erscheint in der Galaxie als Dunkelwolke.
struct PhasenView: View {
    @Environment(AppModel.self) private var model
    @State private var bearbeitet: Phase?

    var body: some View {
        List {
            Section {
                Text("Eine Dunkelwolke bewertet nichts. Sie hält fest, dass eine Zeit schwer war, und zeigt dir später, wie lange sie gedauert hat.")
                    .font(.subheadline).foregroundStyle(Stil.matt).listRowBackground(Color.clear)
                Button {
                    bearbeitet = Phase(name: "", beginn: .now)
                } label: { Label("Schwere Phase eintragen", systemImage: "cloud.fill") }
                    .listRowBackground(Stil.tafel)
            }
            ForEach(model.bestand.phasen.reversed()) { phase in
                Button { bearbeitet = phase } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(phase.name.isEmpty ? "Schwere Zeit" : phase.name).foregroundStyle(Stil.tinte)
                        if let ende = phase.ende {
                            Text("\(Zeit.kurz(phase.beginn)) bis \(Zeit.kurz(ende)), \(Ueberblick.dauer(von: phase.beginn, bis: ende))")
                                .font(.footnote).foregroundStyle(Stil.matt)
                        } else {
                            Text("Seit \(Zeit.kurz(phase.beginn)), dauert an").font(.footnote).foregroundStyle(Stil.gold)
                        }
                    }
                }
                .swipeActions(edge: .trailing) {
                    Button("Löschen", role: .destructive) { model.aendere { $0.phasen.removeAll { $0.id == phase.id } } }
                }
                .swipeActions(edge: .leading) {
                    if phase.ende == nil {
                        Button("Ist vorbei") { setze(phase.id) { $0.ende = .now } }.tint(Stil.gold)
                    }
                }
                .listRowBackground(Stil.tafel)
            }
        }
        .raumHintergrund()
        .navigationTitle("Schwere Phasen")
        .sheet(item: $bearbeitet) { phase in
            PhaseBearbeitenView(phase: phase) { neu in
                model.aendere { bestand in
                    if let i = bestand.phasen.firstIndex(where: { $0.id == neu.id }) { bestand.phasen[i] = neu } else { bestand.phasen.append(neu) }
                    bestand.phasen.sort { $0.beginn < $1.beginn }
                }
            }
        }
    }

    private func setze(_ id: UUID, _ aenderung: (inout Phase) -> Void) {
        model.aendere { bestand in
            if let i = bestand.phasen.firstIndex(where: { $0.id == id }) { aenderung(&bestand.phasen[i]) }
        }
    }
}

struct PhaseBearbeitenView: View {
    @Environment(\.dismiss) private var schliessen
    @State var phase: Phase
    let fertig: (Phase) -> Void
    @State private var dauertAn = true
    @State private var ende = Date.now

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Name, zum Beispiel Jobsuche", text: $phase.name)
                    DatePicker("Beginn", selection: $phase.beginn, in: ...Date.now, displayedComponents: .date)
                    Toggle("Dauert noch an", isOn: $dauertAn)
                    if !dauertAn {
                        DatePicker("Ende", selection: $ende, in: phase.beginn...Date.now, displayedComponents: .date)
                    }
                }
                .listRowBackground(Stil.tafel)
            }
            .raumHintergrund()
            .navigationTitle("Schwere Phase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Abbrechen") { schliessen() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Sichern") {
                        var neu = phase
                        neu.name = neu.name.trimmingCharacters(in: .whitespaces).isEmpty ? "Schwere Zeit" : neu.name
                        neu.ende = dauertAn ? nil : max(ende, neu.beginn)
                        fertig(neu)
                        schliessen()
                    }
                }
            }
            .onAppear {
                dauertAn = phase.ende == nil
                ende = phase.ende ?? .now
            }
        }
        .presentationDetents([.medium, .large])
    }
}

/// Monde: Menschen, Vorhaben und Ziele, die gerade zu einem Lebensbereich gehören.
struct MondeView: View {
    @Environment(AppModel.self) private var model
    @State private var name = ""
    @State private var bereich = Bereich.menschen
    @State private var art = MondArt.mensch

    var body: some View {
        List {
            Section("Neuer Mond") {
                TextField("Name", text: $name)
                Picker("Kreist um", selection: $bereich) { ForEach(Bereich.allCases) { Text($0.titel).tag($0) } }
                Picker("Art", selection: $art) { ForEach(MondArt.allCases, id: \.self) { Text($0.titel).tag($0) } }
                Button("Hinzufügen") {
                    let sauber = name.trimmingCharacters(in: .whitespaces)
                    model.aendere { $0.monde.append(Mond(name: sauber, bereich: bereich, art: art)) }
                    name = ""
                }
                .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .listRowBackground(Stil.tafel)
            ForEach(Bereich.allCases) { b in
                let monde = model.bestand.monde.filter { $0.bereich == b }
                if !monde.isEmpty {
                    Section(b.titel) {
                        ForEach(monde) { mond in
                            HStack {
                                Circle().fill(b.farbe).frame(width: 9, height: 9)
                                Text(mond.name).foregroundStyle(Stil.tinte)
                                Spacer()
                                Text(mond.art.titel).font(.footnote).foregroundStyle(Stil.matt)
                            }
                            .swipeActions { Button("Löschen", role: .destructive) { model.aendere { $0.monde.removeAll { $0.id == mond.id } } } }
                        }
                    }
                    .listRowBackground(Stil.tafel)
                }
            }
        }
        .raumHintergrund()
        .navigationTitle("Monde")
    }
}

/// Ein einzelnes Ereignis von Hand eintragen.
struct SternView: View {
    @Environment(AppModel.self) private var model
    @State private var titel = ""
    @State private var datum = Date.now
    @State private var bereich = Bereich.menschen
    @State private var gewicht = 2
    @State private var text = ""

    private var eigene: [Ereignis] { model.bestand.ereignisse.filter { $0.herkunft == .hand }.sorted { $0.datum > $1.datum } }

    var body: some View {
        List {
            Section("Neuer Stern") {
                TextField("Was ist passiert?", text: $titel)
                DatePicker("Wann", selection: $datum, in: ...Date.now, displayedComponents: .date)
                Picker("Lebensbereich", selection: $bereich) { ForEach(Bereich.allCases) { Text($0.titel).tag($0) } }
                Picker("Bedeutung", selection: $gewicht) {
                    Text("klein").tag(1)
                    Text("wichtig").tag(2)
                    Text("prägend").tag(3)
                }
                .pickerStyle(.segmented)
                TextField("Ein Satz dazu (freiwillig)", text: $text, axis: .vertical).lineLimit(1...4)
                Button("In die Galaxie setzen") {
                    let sauber = titel.trimmingCharacters(in: .whitespaces)
                    model.aendere { $0.ereignisse.append(Ereignis(titel: sauber, datum: datum, bereich: bereich, gewicht: gewicht, text: text)) }
                    titel = ""
                    text = ""
                }
                .disabled(titel.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .listRowBackground(Stil.tafel)
            if !eigene.isEmpty {
                Section("Von dir eingetragen") {
                    ForEach(eigene) { ereignis in
                        HStack {
                            Circle().fill(ereignis.bereich.farbe).frame(width: 9, height: 9)
                            Text(ereignis.titel).foregroundStyle(Stil.tinte)
                            Spacer()
                            Text(Zeit.kurz(ereignis.datum)).font(.footnote).foregroundStyle(Stil.matt)
                        }
                        .swipeActions { Button("Löschen", role: .destructive) { model.aendere { $0.ereignisse.removeAll { $0.id == ereignis.id } } } }
                    }
                }
                .listRowBackground(Stil.tafel)
            }
        }
        .raumHintergrund()
        .navigationTitle("Stern hinzufügen")
    }
}
