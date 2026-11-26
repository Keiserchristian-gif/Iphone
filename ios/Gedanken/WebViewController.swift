import UIKit
import WebKit

final class WebViewController: UIViewController {
    private var webView: WKWebView!
    private var bridge: Bridge!
    private let files = SchemeHandler()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(red: 0.055, green: 0.059, blue: 0.078, alpha: 1)
                : UIColor(red: 0.957, green: 0.961, blue: 0.980, alpha: 1)
        }

        bridge = Bridge(host: self)

        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(files, forURLScheme: "gedanken")
        config.userContentController.addUserScript(
            WKUserScript(source: bridge.bootScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        config.userContentController.addScriptMessageHandler(bridge, contentWorld: .page, name: "gedanken")

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsLinkPreview = false
        webView.isInspectable = true
        view.addSubview(webView)
        bridge.webView = webView

        if let url = URL(string: "gedanken://app/index.html") {
            webView.load(URLRequest(url: url))
        }

        NotificationCenter.default.addObserver(
            self, selector: #selector(becameActive), name: UIApplication.didBecomeActiveNotification, object: nil
        )
    }

    @objc private func becameActive() {
        bridge.emit("active", [:])
    }
}
