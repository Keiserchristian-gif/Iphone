import LebensKern
import SwiftUI
import UIKit
import WebKit

/// Verbindet die App mit der 3D-Szene in der Web-Ansicht.
/// Die Seite stammt aus der App selbst. Jeder Netzwerkzugriff ist gesperrt.
@MainActor
final class SzeneSteuerung: NSObject, WKNavigationDelegate {
    let web: WKWebView
    private var bereit = false
    private var wartend: [() -> Void] = []
    private let empfaenger: Empfaenger

    var beiWahl: ((_ art: String, _ id: String) -> Void)?
    var beiVerschmolzen: (() -> Void)?

    override init() {
        let einstellung = WKWebViewConfiguration()
        einstellung.websiteDataStore = .nonPersistent()
        let empfaenger = Empfaenger()
        einstellung.userContentController.add(empfaenger, name: "app")
        web = WKWebView(frame: .zero, configuration: einstellung)
        self.empfaenger = empfaenger
        super.init()
        empfaenger.ziel = self
        web.navigationDelegate = self
        web.isOpaque = false
        web.backgroundColor = UIColor(red: 0.024, green: 0.020, blue: 0.102, alpha: 1)
        web.scrollView.backgroundColor = web.backgroundColor
        web.scrollView.isScrollEnabled = false
        web.scrollView.bounces = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.allowsLinkPreview = false
        #if DEBUG
        web.isInspectable = true
        #endif
        ladeMitNetzsperre()
    }

    /// Erst die Sperrregel, dann die Seite. So kann auch der erste Ladevorgang nichts aus dem Netz holen.
    private func ladeMitNetzsperre() {
        let regel = #"[{"trigger":{"url-filter":"^(https?|wss?|ftp)://"},"action":{"type":"block"}}]"#
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "kein-netz", encodedContentRuleList: regel) { [weak self] liste, _ in
            Task { @MainActor in
                guard let self else { return }
                if let liste { self.web.configuration.userContentController.add(liste) }
                guard let seite = Bundle.main.url(forResource: "szene", withExtension: "html") else { return }
                self.web.loadFileURL(seite, allowingReadAccessTo: seite.deletingLastPathComponent())
            }
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction) async -> WKNavigationActionPolicy {
        navigationAction.request.url?.isFileURL == true ? .allow : .cancel
    }

    // MARK: App an Szene

    private func fuehreAus(_ aktion: @escaping () -> Void) {
        if bereit { aktion() } else { wartend.append(aktion) }
    }

    private func js(_ code: String) {
        fuehreAus { [web] in web.evaluateJavaScript(code, completionHandler: nil) }
    }

    func setze(json: String) {
        fuehreAus { [web] in
            web.callAsyncJavaScript("window.Szene.setze(daten)", arguments: ["daten": json], in: nil, in: .page, completionHandler: nil)
        }
    }

    func modus(_ modus: String) { js("window.Szene.modus('\(modus == "system" ? "system" : "galaxie")')") }
    func funke() { js("window.Szene.funke()") }
    func verschmelze() { js("window.Szene.verschmelze()") }
    func zeit(_ t: Double?) { js("window.Szene.zeit(\(t.map { String(format: "%.3f", $0) } ?? "null"))") }
    func raender(oben: CGFloat, unten: CGFloat) { js("window.Szene.raender(\(Int(oben)), \(Int(unten)))") }
    func hebeAuswahlAuf() { js("window.Szene.waehle(null)") }
    func filter(_ bereich: Bereich?) { js("window.Szene.filter(\(bereich.map { "'\($0.rawValue)'" } ?? "null"))") }

    // MARK: Szene an App

    fileprivate func empfange(_ nachricht: [String: Any]) {
        switch nachricht["typ"] as? String {
        case "bereit":
            bereit = true
            wartend.forEach { $0() }
            wartend = []
        case "wahl":
            beiWahl?(nachricht["art"] as? String ?? "nichts", nachricht["id"] as? String ?? "")
        case "verschmolzen":
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            beiVerschmolzen?()
        case "haptik":
            let stark = (nachricht["art"] as? String) == "stark"
            UIImpactFeedbackGenerator(style: stark ? .heavy : .light).impactOccurred()
        default:
            break
        }
    }
}

/// Hält die Steuerung nur schwach, damit Web-Ansicht und Steuerung sich nicht gegenseitig am Leben halten.
private final class Empfaenger: NSObject, WKScriptMessageHandler {
    weak var ziel: SzeneSteuerung?

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let inhalt = message.body as? [String: Any] else { return }
        Task { @MainActor in self.ziel?.empfange(inhalt) }
    }
}

struct SzeneWebView: UIViewRepresentable {
    let steuerung: SzeneSteuerung

    func makeUIView(context: Context) -> WKWebView { steuerung.web }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
