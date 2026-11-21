import LebensKern
import SwiftUI
import UniformTypeIdentifiers

struct EinstellungenView: View {
    @Environment(AppModel.self) private var model
    @State private var rufname = ""
    @State private var geburt = Date.now
    @State private var passwort = ""
    @State private var export: SicherungsDatei?
    @State private var zeigtExport = false
    @State private var zeigtImport = false
    @State private var importPaket: Data?
    @State private var importPasswort = ""
    @State private var hinweis: String?
    @State private var fragtLoeschen = false

    var body: some View {
        if model.istBeispiel { beispielInfo } else { echt }
    }

    private var beispielInfo: some View {
        List {
            Section {
                Text("Du siehst ein erfundenes Beispiel-Leben. Alles, was du hier ausprobierst, bleibt nur im Arbeitsspeicher und ist weg, sobald du das Beispiel beendest. Deine echten Daten bleiben unberührt.")
                    .foregroundStyle(Stil.tinte)
                Button("Beispiel beenden") { model.beendeBeispiel() }
            }
            .listRowBackground(Stil.tafel)
        }
        .raumHintergrund()
        .navigationTitle("Einstellungen")
    }

    private var echt: some View {
        List {
            Section("Du") {
                TextField("Rufname", text: $rufname)
                DatePicker("Geburtsdatum", selection: $geburt, in: ...Date.now, displayedComponents: .date)
                Button("Sichern") {
                    model.aendere { $0.profil = Profil(rufname: rufname.trimmingCharacters(in: .whitespaces), geburt: geburt) }
                }
                .disabled(rufname.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .listRowBackground(Stil.tafel)

            Section {
                Text(Auswertung.kiStand).font(.subheadline).foregroundStyle(Stil.tinte)
            } header: { Text("Auswertung") } footer: {
                Text("Die Auswertung läuft auf dem iPhone. Kein Eintrag und kein Dokument wird verschickt.")
            }
            .listRowBackground(Stil.tafel)

            Section {
                SecureField("Passwort für die Sicherung", text: $passwort)
                Button("Sicherung erstellen") {
                    do {
                        export = SicherungsDatei(daten: try model.sicherung(passwort: passwort))
                        zeigtExport = true
                        hinweis = nil
                    } catch {
                        hinweis = (error as? LocalizedError)?.errorDescription ?? "Die Sicherung konnte nicht erstellt werden."
                    }
                }
                Button("Sicherung einlesen") { zeigtImport = true }
                if let hinweis { Text(hinweis).font(.footnote).foregroundStyle(Stil.gold) }
            } header: { Text("Sicherung") } footer: {
                Text("Die Sicherung ist mit deinem Passwort verschlüsselt. Ohne das Passwort kann niemand sie lesen, auch du nicht. Originaldateien eingelesener Dokumente sind nicht enthalten, der erkannte Text schon.")
            }
            .listRowBackground(Stil.tafel)

            Section {
                Button("Alles löschen", role: .destructive) { fragtLoeschen = true }
            } footer: {
                Text("Entfernt alle Einträge, Dokumente und den Schlüssel von diesem iPhone. Das lässt sich nicht rückgängig machen.")
            }
            .listRowBackground(Stil.tafel)

            Section {
                Text("Alle Daten liegen verschlüsselt nur auf diesem iPhone. Die App hat kein Konto, keinen Server und baut keine Netzwerkverbindung auf.")
                    .font(.footnote).foregroundStyle(Stil.matt).listRowBackground(Color.clear)
            }
        }
        .raumHintergrund()
        .navigationTitle("Einstellungen")
        .onAppear {
            rufname = model.bestand.profil?.rufname ?? ""
            geburt = model.bestand.profil?.geburt ?? .now
        }
        .fileExporter(isPresented: $zeigtExport, document: export, contentType: .data, defaultFilename: "Lebensgalaxie-Sicherung.lgs") { ergebnis in
            if case .success = ergebnis { hinweis = "Sicherung gespeichert."; passwort = "" }
        }
        .fileImporter(isPresented: $zeigtImport, allowedContentTypes: [.data]) { ergebnis in
            guard case .success(let url) = ergebnis else { return }
            let zugriff = url.startAccessingSecurityScopedResource()
            defer { if zugriff { url.stopAccessingSecurityScopedResource() } }
            importPaket = try? Data(contentsOf: url)
            if importPaket == nil { hinweis = "Die Datei ließ sich nicht öffnen." }
        }
        .alert("Sicherung einlesen", isPresented: Binding(get: { importPaket != nil }, set: { if !$0 { importPaket = nil; importPasswort = "" } })) {
            SecureField("Passwort", text: $importPasswort)
            Button("Einlesen und alles ersetzen", role: .destructive) {
                guard let paket = importPaket else { return }
                do {
                    try model.stelleWiederHer(paket, passwort: importPasswort)
                    hinweis = "Sicherung eingelesen."
                } catch {
                    hinweis = (error as? LocalizedError)?.errorDescription ?? "Die Sicherung konnte nicht gelesen werden."
                }
                importPasswort = ""
            }
            Button("Abbrechen", role: .cancel) { importPasswort = "" }
        } message: {
            Text("Der jetzige Datenbestand auf diesem iPhone wird durch die Sicherung ersetzt.")
        }
        .confirmationDialog("Wirklich alles löschen?", isPresented: $fragtLoeschen, titleVisibility: .visible) {
            Button("Alles unwiderruflich löschen", role: .destructive) { model.loescheAlles() }
            Button("Abbrechen", role: .cancel) {}
        }
    }
}
