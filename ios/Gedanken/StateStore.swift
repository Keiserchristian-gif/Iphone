import Foundation

/// Hält alle Gedanken als Datei in der App, damit nichts verloren geht.
final class StateStore {
    private var url: URL? {
        guard let dir = try? FileManager.default.url(
            for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true
        ) else { return nil }
        return dir.appendingPathComponent("gedanken.json")
    }

    func load() -> String? {
        guard let file = url, let data = try? Data(contentsOf: file) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    /// Hinterlässt eine kleine Marke, sobald die Oberfläche geladen ist (der automatische Bau prüft sie).
    func markReady() {
        guard let file = url?.deletingLastPathComponent().appendingPathComponent("ready.txt") else { return }
        try? Data("ready".utf8).write(to: file, options: .atomic)
    }

    func save(_ json: String) {
        guard let file = url else { return }
        try? Data(json.utf8).write(to: file, options: .atomic)
    }
}
