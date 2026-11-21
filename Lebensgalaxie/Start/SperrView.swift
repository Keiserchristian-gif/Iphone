import SwiftUI

/// Der Sperrbildschirm. Fragt beim Erscheinen von selbst nach Face ID.
struct SperrView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.scenePhase) private var phase

    var body: some View {
        VStack(spacing: 22) {
            Spacer()
            Image(systemName: "sparkles").font(.system(size: 60)).foregroundStyle(Stil.gold)
            Text("Lebensgalaxie").font(.largeTitle.weight(.semibold)).foregroundStyle(Stil.tinte)
            Text("Dein Leben liegt verschlüsselt auf diesem iPhone.")
                .font(.subheadline).foregroundStyle(Stil.matt).multilineTextAlignment(.center)
            if let meldung = model.meldung {
                Text(meldung).font(.footnote).foregroundStyle(Stil.warnung).multilineTextAlignment(.center).padding(.top, 4)
            }
            Spacer()
            Button {
                Task { await model.oeffne() }
            } label: {
                Label(model.oeffnetGerade ? "Wird geöffnet …" : "Öffnen", systemImage: "faceid")
            }
            .buttonStyle(Hauptknopf())
            .disabled(model.oeffnetGerade)
        }
        .padding(28)
        .task(id: phase) {
            if phase == .active { await model.oeffne() }
        }
    }
}
