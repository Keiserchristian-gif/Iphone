import LebensKern
import SwiftUI

@main
struct LebensgalaxieApp: App {
    @State private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            Wurzel()
                .environment(model)
                .environment(\.locale, Locale(identifier: "de_DE"))
                .preferredColorScheme(.dark)
                .tint(Stil.gold)
        }
    }
}

struct Wurzel: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var phase

    var body: some View {
        ZStack {
            Stil.raum.ignoresSafeArea()
            switch model.zustand {
            case .gesperrt:
                SperrView()
            case .offen:
                if model.bestand.profil == nil {
                    ErsterStartView()
                } else {
                    WeltView()
                }
            }
            // Sichtschutz: Im App-Umschalter und beim Wegwischen ist nichts Persönliches zu sehen.
            if phase != .active, !model.demo, model.zustand == .offen {
                Sichtschutz()
            }
        }
        .onChange(of: phase) { _, neu in
            if neu == .background { model.sperre() }
        }
    }
}

struct Sichtschutz: View {
    var body: some View {
        ZStack {
            Stil.raum.ignoresSafeArea()
            Image(systemName: "sparkles")
                .font(.system(size: 54))
                .foregroundStyle(Stil.gold)
        }
    }
}
