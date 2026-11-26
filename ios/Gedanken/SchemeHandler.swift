import Foundation
import UniformTypeIdentifiers
import WebKit

/// Liefert die Dateien der Web-App aus dem App-Paket unter gedanken://app/…
final class SchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url,
              let base = Bundle.main.resourceURL?.appendingPathComponent("web", isDirectory: true) else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorBadURL))
            return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let file = base.appendingPathComponent(String(path.dropFirst()))
        guard !path.contains(".."), let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist))
            return
        }
        var mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        if mime.hasPrefix("text/") || mime.hasSuffix("javascript") { mime += "; charset=utf-8" }
        let response = HTTPURLResponse(
            url: url, statusCode: 200, httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": mime, "Cache-Control": "no-store"]
        )!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
