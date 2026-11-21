import SwiftUI
import LebensKern

/// Farben und wiederkehrende Formen. Die App hat bewusst nur ein dunkles Aussehen: Sie spielt im Weltraum.
enum Stil {
    static let raum = Color(red: 0.024, green: 0.020, blue: 0.102)
    static let tafel = Color(red: 0.086, green: 0.071, blue: 0.204)
    static let feld = Color(red: 0.130, green: 0.110, blue: 0.280)
    static let linie = Color(red: 0.63, green: 0.59, blue: 1.0).opacity(0.28)
    static let tinte = Color(red: 0.95, green: 0.94, blue: 1.0)
    static let matt = Color(red: 0.70, green: 0.67, blue: 0.87)
    static let gold = Color(red: 1.0, green: 0.816, blue: 0.541)
    static let warnung = Color(red: 1.0, green: 0.56, blue: 0.56)
}

extension Bereich {
    var farbe: Color {
        switch self {
        case .menschen: return Color(red: 1.0, green: 0.561, blue: 0.659)
        case .arbeit: return Color(red: 1.0, green: 0.784, blue: 0.341)
        case .gesundheit: return Color(red: 0.431, green: 0.906, blue: 0.718)
        case .geld: return Color(red: 0.435, green: 0.827, blue: 1.0)
        case .traeume: return Color(red: 0.765, green: 0.651, blue: 1.0)
        }
    }

    var symbol: String {
        switch self {
        case .menschen: return "person.2.fill"
        case .arbeit: return "hammer.fill"
        case .gesundheit: return "heart.fill"
        case .geld: return "banknote.fill"
        case .traeume: return "sparkles"
        }
    }
}

/// Schwebende Glasfläche über der Szene.
struct Tafel: ViewModifier {
    var rund: CGFloat = 20
    func body(content: Content) -> some View {
        content
            .background(Stil.tafel.opacity(0.82), in: RoundedRectangle(cornerRadius: rund, style: .continuous))
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: rund, style: .continuous))
            .overlay(RoundedRectangle(cornerRadius: rund, style: .continuous).strokeBorder(Stil.linie))
    }
}

extension View {
    func tafel(rund: CGFloat = 20) -> some View { modifier(Tafel(rund: rund)) }

    /// Einheitlicher Hintergrund für alle Listen und Formulare.
    func raumHintergrund() -> some View {
        scrollContentBackground(.hidden).background(Stil.raum.ignoresSafeArea())
    }
}

/// Der eine auffällige Knopf pro Bildschirm.
struct Hauptknopf: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(Stil.gold.opacity(configuration.isPressed ? 0.7 : 1), in: Capsule())
            .foregroundStyle(Stil.raum)
    }
}

struct Nebenknopf: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.semibold))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Capsule().strokeBorder(Stil.tinte.opacity(configuration.isPressed ? 0.5 : 0.9)))
            .foregroundStyle(Stil.tinte)
    }
}

/// Auswahlplättchen für Lebensbereiche und Mehrfachauswahl.
struct Plaettchen: View {
    let text: String
    var farbe: Color = Stil.gold
    let gewaehlt: Bool
    let aktion: () -> Void

    var body: some View {
        Button(action: aktion) {
            Text(text)
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 13)
                .padding(.vertical, 8)
                .background(gewaehlt ? farbe : Stil.feld, in: Capsule())
                .foregroundStyle(gewaehlt ? Stil.raum : Stil.tinte)
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(gewaehlt ? .isSelected : [])
    }
}

/// Ordnet Kinder in Zeilen an und bricht um, wenn die Breite nicht reicht.
struct Fluss: Layout {
    var abstand: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let breite = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, zeile: CGFloat = 0, maxX: CGFloat = 0
        for kind in subviews {
            let g = kind.sizeThatFits(.unspecified)
            if x > 0, x + g.width > breite { x = 0; y += zeile + abstand; zeile = 0 }
            x += g.width + abstand
            zeile = max(zeile, g.height)
            maxX = max(maxX, x - abstand)
        }
        return CGSize(width: proposal.width ?? maxX, height: y + zeile)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, zeile: CGFloat = 0
        for kind in subviews {
            let g = kind.sizeThatFits(.unspecified)
            if x > bounds.minX, x + g.width > bounds.maxX { x = bounds.minX; y += zeile + abstand; zeile = 0 }
            kind.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(g))
            x += g.width + abstand
            zeile = max(zeile, g.height)
        }
    }
}

enum Stimmung {
    static let symbole = ["cloud.heavyrain.fill", "cloud.fill", "cloud.sun.fill", "sun.max.fill", "sparkles"]
    static let worte = ["schwer", "gedrückt", "gemischt", "gut", "sehr gut"]

    static func symbol(_ stufe: Int) -> String { (1...5).contains(stufe) ? symbole[stufe - 1] : "circle.dotted" }
    static func wort(_ stufe: Int) -> String { (1...5).contains(stufe) ? worte[stufe - 1] : "keine Angabe" }
}
