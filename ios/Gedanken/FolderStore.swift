import UIKit
import UniformTypeIdentifiers

/// Merkt sich den in „Dateien“ gewählten Ordner und schreibt die PDFs direkt hinein.
@MainActor
final class FolderStore: NSObject, UIDocumentPickerDelegate {
    private let key = "folderBookmark"
    private var pending: ((String?) -> Void)?

    var name: String? { resolve()?.lastPathComponent }

    func pick(from host: UIViewController, done: @escaping (String?) -> Void) {
        finish(nil)
        pending = done
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.folder])
        picker.delegate = self
        picker.allowsMultipleSelection = false
        host.present(picker, animated: true)
    }

    func write(_ data: Data, name: String) throws -> String {
        guard let folder = resolve() else { throw NSError(domain: "Gedanken", code: 5) }
        let scoped = folder.startAccessingSecurityScopedResource()
        defer { if scoped { folder.stopAccessingSecurityScopedResource() } }
        var coordinationError: NSError?
        var writeError: Error?
        NSFileCoordinator().coordinate(
            writingItemAt: folder.appendingPathComponent(name), options: .forReplacing, error: &coordinationError
        ) { target in
            do { try data.write(to: target) } catch { writeError = error }
        }
        if let error = coordinationError ?? (writeError as NSError?) { throw error }
        return folder.lastPathComponent
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let folder = urls.first else { finish(nil); return }
        let scoped = folder.startAccessingSecurityScopedResource()
        defer { if scoped { folder.stopAccessingSecurityScopedResource() } }
        guard let bookmark = try? folder.bookmarkData() else { finish(nil); return }
        UserDefaults.standard.set(bookmark, forKey: key)
        finish(folder.lastPathComponent)
    }

    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        finish(nil)
    }

    private func finish(_ name: String?) {
        let done = pending
        pending = nil
        done?(name)
    }

    private func resolve() -> URL? {
        guard let bookmark = UserDefaults.standard.data(forKey: key) else { return nil }
        var stale = false
        guard let folder = try? URL(resolvingBookmarkData: bookmark, bookmarkDataIsStale: &stale) else { return nil }
        if stale {
            let scoped = folder.startAccessingSecurityScopedResource()
            if let fresh = try? folder.bookmarkData() { UserDefaults.standard.set(fresh, forKey: key) }
            if scoped { folder.stopAccessingSecurityScopedResource() }
        }
        return folder
    }
}
