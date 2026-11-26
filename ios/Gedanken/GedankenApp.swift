import SwiftUI

/// Gedanken – die iPhone-App. Die Oberfläche ist die getestete Web-App aus dem Repository;
/// diese Hülle gibt ihr, was nur ein iPhone kann: Mikrofon, Kalender, festen Ordner und Mail.
@main
struct GedankenApp: App {
    var body: some Scene {
        WindowGroup {
            WebScreen()
                .ignoresSafeArea()
        }
    }
}

struct WebScreen: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> WebViewController {
        WebViewController()
    }

    func updateUIViewController(_ controller: WebViewController, context: Context) {}
}
