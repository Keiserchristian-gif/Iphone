import CryptoKit
import Foundation
import LocalAuthentication
import Security

enum TresorFehler: LocalizedError {
    case keinGeraetecode
    case abgebrochen
    case schluessel(OSStatus)
    case beschaedigt
    case ordner

    var errorDescription: String? {
        switch self {
        case .keinGeraetecode:
            return "Richte in den iPhone-Einstellungen einen Gerätecode ein. Ohne ihn kann die App deine Daten nicht schützen."
        case .abgebrochen:
            return nil
        case .schluessel(let status):
            return "Der Schlüssel konnte nicht gelesen werden (Fehler \(status))."
        case .beschaedigt:
            return "Der gespeicherte Datenbestand lässt sich nicht entschlüsseln."
        case .ordner:
            return "Der geschützte Ordner konnte nicht angelegt werden."
        }
    }
}

/// Verschlüsselter Speicher auf dem Gerät.
/// Der Schlüssel liegt im Schlüsselbund, verlässt dieses Gerät nie und wird nur nach Face ID oder Gerätecode herausgegeben.
final class Tresor {
    private static let dienst = "de.lebensgalaxie.app.schluessel"
    private static let konto = "bestand"

    let ordner: URL

    init() throws {
        guard var basis = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            throw TresorFehler.ordner
        }
        basis.appendPathComponent("Tresor", isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: basis, withIntermediateDirectories: true,
                                                    attributes: [.protectionKey: FileProtectionType.complete])
            var werte = URLResourceValues()
            werte.isExcludedFromBackup = true
            try basis.setResourceValues(werte)
        } catch {
            throw TresorFehler.ordner
        }
        ordner = basis
    }

    private var bestandsDatei: URL { ordner.appendingPathComponent("bestand.lg") }

    /// Fragt Face ID oder den Gerätecode ab. Der zurückgegebene Kontext gilt für den anschließenden Zugriff auf den Schlüssel.
    static func pruefe(grund: String) async throws -> LAContext {
        let kontext = LAContext()
        kontext.localizedFallbackTitle = "Code eingeben"
        var fehler: NSError?
        guard kontext.canEvaluatePolicy(.deviceOwnerAuthentication, error: &fehler) else {
            throw TresorFehler.keinGeraetecode
        }
        do {
            _ = try await kontext.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: grund)
        } catch {
            throw TresorFehler.abgebrochen
        }
        return kontext
    }

    /// Liest den Schlüssel oder legt beim ersten Start einen neuen an.
    func schluessel(kontext: LAContext) throws -> SymmetricKey {
        let suche: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.dienst,
            kSecAttrAccount as String: Self.konto,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecUseAuthenticationContext as String: kontext,
        ]
        var fund: CFTypeRef?
        let status = SecItemCopyMatching(suche as CFDictionary, &fund)
        if status == errSecSuccess, let daten = fund as? Data, daten.count == 32 {
            return SymmetricKey(data: daten)
        }
        guard status == errSecItemNotFound else { throw TresorFehler.schluessel(status) }
        // Ein vorhandener Datenbestand ohne Schlüssel wäre verloren. Dann lieber abbrechen als überschreiben.
        guard !FileManager.default.fileExists(atPath: bestandsDatei.path) else { throw TresorFehler.beschaedigt }

        let neu = SymmetricKey(size: .bits256)
        let roh = neu.withUnsafeBytes { Data($0) }
        var zugriffsFehler: Unmanaged<CFError>?
        guard let zugriff = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
                                                            .userPresence, &zugriffsFehler) else {
            throw TresorFehler.keinGeraetecode
        }
        let eintrag: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.dienst,
            kSecAttrAccount as String: Self.konto,
            kSecValueData as String: roh,
            kSecAttrAccessControl as String: zugriff,
            kSecUseAuthenticationContext as String: kontext,
        ]
        let angelegt = SecItemAdd(eintrag as CFDictionary, nil)
        guard angelegt == errSecSuccess else { throw TresorFehler.schluessel(angelegt) }
        return neu
    }

    // MARK: Datenbestand

    func ladeBestand(_ schluessel: SymmetricKey) throws -> Data? {
        guard FileManager.default.fileExists(atPath: bestandsDatei.path) else { return nil }
        return try oeffne(Data(contentsOf: bestandsDatei), schluessel)
    }

    func speichereBestand(_ daten: Data, _ schluessel: SymmetricKey) throws {
        try verschliesse(daten, schluessel).write(to: bestandsDatei, options: [.atomic, .completeFileProtection])
    }

    // MARK: Originaldateien

    func speichereDatei(_ daten: Data, name: String, _ schluessel: SymmetricKey) throws {
        try verschliesse(daten, schluessel).write(to: ordner.appendingPathComponent(name), options: [.atomic, .completeFileProtection])
    }

    func ladeDatei(name: String, _ schluessel: SymmetricKey) throws -> Data {
        try oeffne(Data(contentsOf: ordner.appendingPathComponent(name)), schluessel)
    }

    func loescheDatei(name: String) {
        try? FileManager.default.removeItem(at: ordner.appendingPathComponent(name))
    }

    /// Entfernt Datenbestand, Dokumente und Schlüssel unwiderruflich.
    func loescheAlles() {
        for datei in (try? FileManager.default.contentsOfDirectory(at: ordner, includingPropertiesForKeys: nil)) ?? [] {
            try? FileManager.default.removeItem(at: datei)
        }
        let suche: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: Self.dienst,
            kSecAttrAccount as String: Self.konto,
        ]
        SecItemDelete(suche as CFDictionary)
    }

    // MARK: Verschlüsselung

    private func verschliesse(_ daten: Data, _ schluessel: SymmetricKey) throws -> Data {
        guard let paket = try AES.GCM.seal(daten, using: schluessel).combined else { throw TresorFehler.beschaedigt }
        return paket
    }

    private func oeffne(_ paket: Data, _ schluessel: SymmetricKey) throws -> Data {
        do {
            return try AES.GCM.open(AES.GCM.SealedBox(combined: paket), using: schluessel)
        } catch {
            throw TresorFehler.beschaedigt
        }
    }
}
