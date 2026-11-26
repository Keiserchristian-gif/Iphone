import UIKit
import WebKit

/// Verbindet die Web-Oberfläche mit dem iPhone. Die Web-App ruft
/// `window.webkit.messageHandlers.gedanken.postMessage({cmd: …})` und bekommt eine Antwort;
/// Ereignisse (erkannter Text, App wieder im Vordergrund) gehen über `window.GedankenNative.emit`.
@MainActor
final class Bridge: NSObject, WKScriptMessageHandlerWithReply {
    weak var webView: WKWebView?
    private weak var host: UIViewController?
    private let state = StateStore()
    private let speech = SpeechService()
    private let calendar = CalendarService()
    private let folder = FolderStore()
    private let mail = MailSender()
    private var announced = false

    init(host: UIViewController) {
        self.host = host
        super.init()
        speech.onPartial = { [weak self] text in
            self?.emit("speech", ["text": text])
        }
        speech.onEnd = { [weak self] text, error in
            var payload: [String: Any] = ["text": text]
            if let error = error { payload["error"] = error }
            self?.emit("speechEnd", payload)
        }
    }

    /// Wird vor der Web-App geladen: gespeicherter Stand und was dieses iPhone kann.
    func bootScript() -> String {
        let state64 = state.load().map { Data($0.utf8).base64EncodedString() } ?? ""
        return "window.__GEDANKEN_NATIVE__={state64:'\(state64)',caps:\(json(caps()))};"
    }

    func emit(_ name: String, _ payload: [String: Any]) {
        webView?.evaluateJavaScript(
            "window.GedankenNative&&window.GedankenNative.emit('\(name)',\(json(payload)))", completionHandler: nil
        )
    }

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage,
        replyHandler: @escaping @MainActor @Sendable (Any?, String?) -> Void
    ) {
        guard let body = message.body as? [String: Any], let cmd = body["cmd"] as? String else {
            replyHandler(nil, "badMessage")
            return
        }
        let text: (String) -> String = { key in (body[key] as? String) ?? "" }

        switch cmd {
        case "caps":
            if !announced {
                announced = true
                state.markReady()
                NSLog("GEDANKEN_READY")
            }
            replyHandler(caps(), nil)

        case "saveState":
            if let stateJSON = body["json"] as? String { state.save(stateJSON) }
            replyHandler(true, nil)

        case "speechStart":
            speech.start { error in
                if let error = error { replyHandler(nil, error) } else { replyHandler(["ok": true], nil) }
            }

        case "speechStop":
            speech.stop()
            replyHandler(true, nil)

        case "pickFolder":
            guard let host = host else { replyHandler(nil, "noHost"); return }
            folder.pick(from: host) { name in
                if let name = name { replyHandler(["name": name], nil) } else { replyHandler(NSNull(), nil) }
            }

        case "savePdf":
            guard let data = Data(base64Encoded: text("base64")), !text("name").isEmpty else {
                replyHandler(nil, "badData")
                return
            }
            do {
                replyHandler(["folder": try folder.write(data, name: text("name"))], nil)
            } catch {
                replyHandler(nil, "noFolder")
            }

        case "mail":
            guard let host = host else { replyHandler(nil, "noHost"); return }
            let pdf = (body["base64"] as? String).flatMap { Data(base64Encoded: $0) }
            let fileName = text("name").isEmpty ? "MindDesk.pdf" : text("name")
            mail.send(
                from: host, subject: text("subject"), body: text("body"), to: text("to"), pdf: pdf, fileName: fileName
            ) { result in
                replyHandler(["result": result], nil)
            }

        case "calAccess":
            calendar.requestAccess { granted in
                replyHandler(granted ? "granted" : "denied", nil)
            }

        case "calToday":
            replyHandler(calendar.today(), nil)

        case "calAdd":
            do {
                replyHandler(["id": try calendar.add(title: text("title"), due: text("due"), notes: text("notes"))], nil)
            } catch {
                replyHandler(nil, "calendarFailed")
            }

        case "calUpdate":
            do {
                try calendar.update(id: text("id"), title: text("title"), due: text("due"))
                replyHandler(["id": text("id")], nil)
            } catch {
                replyHandler(nil, "calendarFailed")
            }

        case "calRemove":
            calendar.remove(id: text("id"))
            replyHandler(true, nil)

        default:
            replyHandler(nil, "unknownCommand")
        }
    }

    private func caps() -> [String: Any] {
        var out: [String: Any] = ["speech": speech.isAvailable, "mail": true, "calendar": calendar.status]
        if let name = folder.name { out["folder"] = ["name": name] } else { out["folder"] = NSNull() }
        return out
    }

    private func json(_ value: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: value),
              let string = String(data: data, encoding: .utf8) else { return "{}" }
        return string
    }
}
