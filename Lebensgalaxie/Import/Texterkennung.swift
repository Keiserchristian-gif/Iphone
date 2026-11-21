import Foundation
import PDFKit
import UIKit
import UniformTypeIdentifiers
import Vision

enum LeseFehler: LocalizedError {
    case nichtLesbar
    case keinText

    var errorDescription: String? {
        switch self {
        case .nichtLesbar: return "Die Datei ließ sich nicht öffnen."
        case .keinText: return "In der Datei wurde kein Text gefunden."
        }
    }
}

/// Holt Text aus PDFs, Bildern und Textdateien. Alles geschieht auf dem Gerät.
enum Texterkennung {
    static let hoechstSeiten = 30

    /// Liest eine vom Nutzer gewählte Datei. Gibt den Text und die Originaldaten zurück.
    static func lies(url: URL) async throws -> (text: String, original: Data) {
        let zugriff = url.startAccessingSecurityScopedResource()
        defer { if zugriff { url.stopAccessingSecurityScopedResource() } }
        guard let daten = try? Data(contentsOf: url) else { throw LeseFehler.nichtLesbar }
        let typ = UTType(filenameExtension: url.pathExtension.lowercased()) ?? .data
        let text: String = await Task.detached(priority: .userInitiated) { () -> String in
            if typ.conforms(to: .pdf) { return liesPDF(daten) }
            if typ.conforms(to: .image) { return UIImage(data: daten)?.cgImage.map(liesBild) ?? "" }
            return String(data: daten, encoding: .utf8) ?? String(data: daten, encoding: .isoLatin1) ?? ""
        }.value
        let sauber = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !sauber.isEmpty else { throw LeseFehler.keinText }
        return (sauber, daten)
    }

    static func liesPDF(_ daten: Data) -> String {
        guard let pdf = PDFDocument(data: daten) else { return "" }
        var seiten: [String] = []
        for i in 0..<min(pdf.pageCount, hoechstSeiten) {
            guard let seite = pdf.page(at: i) else { continue }
            let eingebettet = (seite.string ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
            if eingebettet.count >= 40 {
                seiten.append(eingebettet)
            } else if let bild = seite.thumbnail(of: CGSize(width: 1654, height: 2339), for: .mediaBox).cgImage {
                // Eingescannte Seite ohne Textebene: Texterkennung auf dem Seitenbild.
                seiten.append(liesBild(bild))
            }
        }
        return seiten.joined(separator: "\n")
    }

    static func liesBild(_ bild: CGImage) -> String {
        let anfrage = VNRecognizeTextRequest()
        anfrage.recognitionLevel = .accurate
        anfrage.recognitionLanguages = ["de-DE", "en-US"]
        anfrage.usesLanguageCorrection = true
        do {
            try VNImageRequestHandler(cgImage: bild, options: [:]).perform([anfrage])
        } catch {
            return ""
        }
        return (anfrage.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: "\n")
    }
}
