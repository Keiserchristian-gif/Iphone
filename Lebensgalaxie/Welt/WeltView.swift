import LebensKern
import SwiftUI

/// Der Hauptbildschirm: die Szene bildschirmfüllend, darüber wenige schwebende Bedienelemente.
struct WeltView: View {
    @Environment(AppModel.self) private var model
    /// Entsteht erst beim Erscheinen. So wird nicht bei jedem Neuzeichnen eine Web-Ansicht angelegt und verworfen.
    @State private var steuerung: SzeneSteuerung?
    @State private var modus = "galaxie"
    @State private var auswahl: Auswahl?
    @State private var notiz = ""
    @State private var zeigtAbschluss = false
    @State private var zeigtMehr = false
    @State private var zeitreise = false
    @State private var zeit = 0.0
    @State private var obenHoehe: CGFloat = 0
    @State private var untenHoehe: CGFloat = 0
    @FocusState private var schreibt: Bool

    private var alter: Double { model.szene.alter }
    private var heute: [Notiz] { model.bestand.notizen(am: .now) }
    private var tagZu: Bool { model.bestand.tag(am: .now) != nil }

    var body: some View {
        ZStack {
            if let steuerung {
                SzeneWebView(steuerung: steuerung)
                    .ignoresSafeArea()
                    .accessibilityLabel("Dein Leben als drehbare Galaxie")
            }

            VStack(spacing: 0) {
                kopf
                    .onGeometryChange(for: CGFloat.self) { $0.frame(in: .global).maxY } action: { obenHoehe = $0; meldeRaender() }
                Spacer(minLength: 0)
                fuss
                    .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { untenHoehe = $0; meldeRaender() }
            }
        }
        .onAppear(perform: verbinde)
        .onChange(of: model.szenenStand) { _, _ in sendeDaten() }
        .onChange(of: modus) { _, neu in
            auswahl = nil
            zeitreise = false
            steuerung?.zeit(nil)
            steuerung?.modus(neu)
        }
        .sheet(isPresented: $zeigtAbschluss) {
            TagesabschlussView { text, stimmung, bereiche, kurz in
                model.schliesseTag(text: text, stimmung: stimmung, bereiche: bereiche, kurz: kurz)
                modus = "galaxie"
                auswahl = nil
                steuerung?.verschmelze()
            }
        }
        .sheet(isPresented: $zeigtMehr) { MehrView() }
        .alert("Die letzten Tage waren schwer", isPresented: Bindable(model).phasenVorschlag) {
            Button("Als Dunkelwolke festhalten") {
                model.aendere { $0.phasen.append(Phase(name: "Schwere Zeit", beginn: Date.now.addingTimeInterval(-6 * 86_400))) }
            }
            Button("Nein", role: .cancel) {}
        } message: {
            Text("Du siehst später, wie lange sie gedauert hat und dass sie vorbeigegangen ist. Unter Phasen kannst du ihr einen Namen geben.")
        }
    }

    // MARK: Oben

    private var kopf: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text(modus == "galaxie" ? "Deine Galaxie" : "Dein Sonnensystem")
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(Stil.tinte)
                Spacer()
                Button { zeigtMehr = true } label: {
                    Image(systemName: "line.3.horizontal")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(Stil.tinte)
                        .frame(width: 44, height: 44)
                        .tafel(rund: 22)
                }
                .accessibilityLabel("Mehr")
            }
            Picker("Ansicht", selection: $modus) {
                Text("Verlauf").tag("galaxie")
                Text("Jetzt").tag("system")
            }
            .pickerStyle(.segmented)
            .frame(maxWidth: 220)
        }
        .padding(.horizontal, 16)
        .padding(.top, 6)
    }

    // MARK: Unten

    private var fuss: some View {
        VStack(spacing: 8) {
            if let fehler = model.speicherFehler {
                Text(fehler).font(.footnote).foregroundStyle(Stil.warnung).padding(10).frame(maxWidth: .infinity).tafel(rund: 14)
            }
            DetailKarte(auswahl: auswahl, schliessen: {
                auswahl = nil
                steuerung?.hebeAuswahlAuf()
            })

            if modus == "galaxie" {
                if zeitreise {
                    HStack(spacing: 10) {
                        Slider(value: $zeit, in: 0...max(alter, 1))
                            .onChange(of: zeit) { _, neu in steuerung?.zeit(neu >= alter - 0.05 ? nil : neu) }
                            .accessibilityLabel("Zeitreise")
                        Text(zeit >= alter - 0.05 ? "heute" : String(model.szene.geburtsjahr + Int(zeit)))
                            .font(.subheadline.weight(.semibold).monospacedDigit())
                            .frame(minWidth: 46, alignment: .trailing)
                        Button {
                            zeitreise = false
                            steuerung?.zeit(nil)
                        } label: { Image(systemName: "xmark").font(.footnote.weight(.bold)) }
                            .accessibilityLabel("Zeitreise beenden")
                    }
                    .foregroundStyle(Stil.tinte)
                    .padding(.horizontal, 14).padding(.vertical, 8)
                    .tafel(rund: 26)
                }
                HStack(spacing: 8) {
                    TextField("Notiz für jetzt", text: $notiz)
                        .focused($schreibt)
                        .submitLabel(.done)
                        .onSubmit(halteFest)
                        .padding(.horizontal, 16).padding(.vertical, 12)
                        .background(Stil.tinte, in: Capsule())
                        .foregroundStyle(Stil.raum)
                        .tint(Stil.raum)
                    Button(action: halteFest) {
                        Image(systemName: "plus").font(.headline).frame(width: 46, height: 46)
                            .background(Stil.gold, in: Circle()).foregroundStyle(Stil.raum)
                    }
                    .disabled(notiz.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityLabel("Notiz festhalten")
                    Button {
                        zeit = alter
                        zeitreise.toggle()
                        if !zeitreise { steuerung?.zeit(nil) }
                    } label: {
                        Image(systemName: "clock.arrow.circlepath").font(.headline).frame(width: 46, height: 46)
                            .tafel(rund: 23).foregroundStyle(Stil.tinte)
                    }
                    .accessibilityLabel("Zeitreise")
                }
                Button(tagZu && heute.isEmpty ? "Tag ergänzen" : (heute.isEmpty ? "Tag abschließen" : "Tag abschließen, \(heute.count) \(heute.count == 1 ? "Notiz" : "Notizen")")) {
                    schreibt = false
                    zeigtAbschluss = true
                }
                .buttonStyle(Nebenknopf())
            }
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
        .animation(.snappy, value: auswahl)
        .animation(.snappy, value: zeitreise)
    }

    // MARK: Verbindung zur Szene

    private func verbinde() {
        guard steuerung == nil else { return }
        let steuerung = SzeneSteuerung()
        self.steuerung = steuerung
        steuerung.beiWahl = { art, id in
            auswahl = art == "nichts" ? nil : Auswahl(art: art, id: id)
            schreibt = false
        }
        steuerung.beiVerschmolzen = { sendeDaten() }
        steuerung.raender(oben: obenHoehe, unten: untenHoehe + 34)
        if let json = szeneJSON() { steuerung.setze(json: json) }
        #if DEBUG
        // Startzustände für automatische Bildschirmfotos: -ansicht system, -blatt abschluss|mehr
        let werte = UserDefaults.standard
        if werte.string(forKey: "ansicht") == "system" { modus = "system" }
        if werte.string(forKey: "blatt") == "abschluss" { zeigtAbschluss = true }
        if werte.string(forKey: "blatt") == "mehr" { zeigtMehr = true }
        #endif
    }

    private func szeneJSON() -> String? {
        guard let roh = try? JSONEncoder().encode(model.szene) else { return nil }
        return String(data: roh, encoding: .utf8)
    }

    private func sendeDaten() {
        if let json = szeneJSON() { steuerung?.setze(json: json) }
    }

    private func meldeRaender() {
        steuerung?.raender(oben: obenHoehe, unten: untenHoehe + 34)
    }

    private func halteFest() {
        let text = notiz.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        model.notiere(text)
        notiz = ""
        zeitreise = false
        auswahl = Auswahl(art: "heute", id: "")
        steuerung?.funke()
    }
}

struct Auswahl: Equatable {
    var art: String
    var id: String
}

/// Die Liste hinter dem Menüknopf.
struct MehrView: View {
    @Environment(\.dismiss) private var schliessen
    @Environment(AppModel.self) private var model

    var body: some View {
        NavigationStack {
            List {
                Section {
                    zeile("Fragebogen", "list.bullet.clipboard", "Füllt deine Galaxie mit deiner Vergangenheit") { FragebogenView() }
                    zeile("Dokumente", "doc.text.viewfinder", "Lebenslauf und andere Unterlagen einlesen") { DokumenteView() }
                    zeile("Stern hinzufügen", "star", "Ein einzelnes Ereignis eintragen") { SternView() }
                }
                Section {
                    zeile("Tagebuch", "book", "\(model.bestand.tage.count) \(model.bestand.tage.count == 1 ? "Tag" : "Tage")") { TagebuchView() }
                    zeile("Schwere Phasen", "cloud", "Dunkelwolken anlegen und beenden") { PhasenView() }
                    zeile("Monde", "moon", "Menschen, Vorhaben und Ziele") { MondeView() }
                }
                Section {
                    zeile("Einstellungen", "gearshape", "Sicherung, Löschen, Auswertung") { EinstellungenView() }
                }
            }
            .listRowBackground(Stil.tafel)
            .raumHintergrund()
            .navigationTitle("Mehr")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Fertig") { schliessen() } } }
        }
    }

    private func zeile<Ziel: View>(_ titel: String, _ symbol: String, _ unter: String, @ViewBuilder ziel: @escaping () -> Ziel) -> some View {
        NavigationLink(destination: ziel) {
            Label {
                VStack(alignment: .leading, spacing: 2) {
                    Text(titel).foregroundStyle(Stil.tinte)
                    Text(unter).font(.footnote).foregroundStyle(Stil.matt)
                }
            } icon: {
                Image(systemName: symbol).foregroundStyle(Stil.gold)
            }
        }
        .listRowBackground(Stil.tafel)
    }
}
