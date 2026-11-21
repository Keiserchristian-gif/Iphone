import LebensKern
import SwiftUI

/// Der allererste Bildschirm: Name und Geburtsdatum. Mehr braucht die Galaxie nicht, um zu entstehen.
struct ErsterStartView: View {
    @Environment(AppModel.self) private var model
    @State private var rufname = ""
    @State private var geburt = Calendar.current.date(byAdding: .year, value: -30, to: .now) ?? .now

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Image(systemName: "sparkles").font(.system(size: 46)).foregroundStyle(Stil.gold).padding(.top, 40)
                Text("Willkommen in deiner Galaxie").font(.largeTitle.weight(.semibold)).foregroundStyle(Stil.tinte)
                Text("Hier siehst du dein Leben von oben: innen deine Geburt, außen heute, jede Umdrehung ein Jahrzehnt. Alles, was du einträgst, bleibt verschlüsselt auf diesem iPhone.")
                    .foregroundStyle(Stil.matt)
                VStack(alignment: .leading, spacing: 10) {
                    Text("Wie sollen wir dich nennen?").font(.headline).foregroundStyle(Stil.tinte)
                    TextField("Rufname", text: $rufname).textContentType(.givenName).feld()
                }
                VStack(alignment: .leading, spacing: 10) {
                    Text("Wann bist du geboren?").font(.headline).foregroundStyle(Stil.tinte)
                    DatePicker("Geburtsdatum", selection: $geburt, in: ...Date.now, displayedComponents: .date)
                        .datePickerStyle(.wheel).labelsHidden().frame(maxWidth: .infinity)
                        .background(Stil.tafel, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                Button("Galaxie erschaffen") {
                    model.aendere { $0.profil = Profil(rufname: rufname.trimmingCharacters(in: .whitespaces), geburt: geburt) }
                }
                .buttonStyle(Hauptknopf())
                .disabled(rufname.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(24)
        }
        .scrollDismissesKeyboard(.interactively)
    }
}
