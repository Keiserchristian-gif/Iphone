import CommonCrypto
import CryptoKit
import Foundation
import SwiftUI
import UniformTypeIdentifiers

enum SicherungsFehler: LocalizedError {
    case passwortZuKurz
    case falschesPasswortOderDatei

    var errorDescription: String? {
        switch self {
        case .passwortZuKurz: return "Das Passwort braucht mindestens 8 Zeichen."
        case .falschesPasswortOderDatei: return "Das Passwort stimmt nicht oder die Datei ist keine Sicherung dieser App."
        }
    }
}

/// Sicherung als Datei, verschlüsselt mit einem selbst gewählten Passwort.
/// Aufbau: Kennung "LGS1", 16 Byte Salz, dann das AES-GCM-Paket. Der Schlüssel entsteht per PBKDF2 aus dem Passwort.
enum Sicherung {
    private static let kennung = Data("LGS1".utf8)
    private static let runden: UInt32 = 310_000

    static func verpacke(_ daten: Data, passwort: String) throws -> Data {
        guard passwort.count >= 8 else { throw SicherungsFehler.passwortZuKurz }
        var salz = Data(count: 16)
        let ok = salz.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }
        guard ok == errSecSuccess else { throw SicherungsFehler.falschesPasswortOderDatei }
        let schluessel = try leiteAb(passwort: passwort, salz: salz)
        guard let paket = try AES.GCM.seal(daten, using: schluessel).combined else { throw SicherungsFehler.falschesPasswortOderDatei }
        return kennung + salz + paket
    }

    static func entpacke(_ paket: Data, passwort: String) throws -> Data {
        guard paket.count > 20 + 28, paket.prefix(4) == kennung else { throw SicherungsFehler.falschesPasswortOderDatei }
        let salz = Data(paket.dropFirst(4).prefix(16))
        let rest = Data(paket.dropFirst(20))
        let schluessel = try leiteAb(passwort: passwort, salz: salz)
        do {
            return try AES.GCM.open(AES.GCM.SealedBox(combined: rest), using: schluessel)
        } catch {
            throw SicherungsFehler.falschesPasswortOderDatei
        }
    }

    private static func leiteAb(passwort: String, salz: Data) throws -> SymmetricKey {
        var abgeleitet = [UInt8](repeating: 0, count: 32)
        let laenge = passwort.utf8.count
        let status = salz.withUnsafeBytes { salzBytes -> Int32 in
            CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), passwort, laenge,
                                 salzBytes.bindMemory(to: UInt8.self).baseAddress, salz.count,
                                 CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), runden, &abgeleitet, 32)
        }
        guard status == kCCSuccess else { throw SicherungsFehler.falschesPasswortOderDatei }
        return SymmetricKey(data: Data(abgeleitet))
    }
}

/// Hülle, damit die Sicherung über den Teilen-Dialog des Systems gespeichert werden kann.
struct SicherungsDatei: FileDocument {
    static var readableContentTypes: [UTType] { [.data] }
    var daten: Data

    init(daten: Data) { self.daten = daten }

    init(configuration: ReadConfiguration) throws {
        daten = configuration.file.regularFileContents ?? Data()
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: daten)
    }
}
