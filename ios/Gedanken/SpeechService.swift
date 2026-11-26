import AVFoundation
import Speech

/// Hört über das Mikrofon zu und liefert den erkannten Text (Deutsch).
final class SpeechService {
    var onPartial: ((String) -> Void)?
    var onEnd: ((String, String?) -> Void)?

    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "de-DE"))
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var latest = ""
    private var running = false
    private var silence: DispatchWorkItem?

    var isAvailable: Bool { recognizer?.isAvailable ?? false }

    /// Fragt beim ersten Mal nach Mikrofon und Spracherkennung. `completion(nil)` heißt: hört zu.
    func start(completion: @escaping (String?) -> Void) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                DispatchQueue.main.async { completion("denied") }
                return
            }
            AVAudioApplication.requestRecordPermission { granted in
                DispatchQueue.main.async {
                    guard granted else { completion("denied"); return }
                    do {
                        try self.begin()
                        completion(nil)
                    } catch {
                        self.cleanUp()
                        completion("failed")
                    }
                }
            }
        }
    }

    func stop() {
        guard running else { return }
        silence?.cancel()
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        // Das letzte Ergebnis kommt gleich; falls nicht, nach kurzer Zeit trotzdem abschließen.
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.finish(error: nil) }
    }

    private func begin() throws {
        guard let recognizer = recognizer, recognizer.isAvailable else {
            throw NSError(domain: "Gedanken", code: 1)
        }
        cleanUp()
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.record, mode: .measurement, options: .duckOthers)
        try session.setActive(true, options: .notifyOthersOnDeactivation)

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        self.request = request
        latest = ""

        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        guard format.channelCount > 0 else { throw NSError(domain: "Gedanken", code: 2) }
        input.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
            self?.request?.append(buffer)
        }
        engine.prepare()
        try engine.start()
        running = true

        task = recognizer.recognitionTask(with: request) { [weak self] result, error in
            let text = result?.bestTranscription.formattedString
            let isFinal = result?.isFinal ?? false
            let failed = error != nil
            DispatchQueue.main.async {
                guard let self = self, self.running else { return }
                if let text = text {
                    self.latest = text
                    self.onPartial?(text)
                    self.armSilence(1.8)
                }
                if isFinal || failed { self.finish(error: nil) }
            }
        }
        armSilence(8)
    }

    /// Nach einer Sprechpause von selbst aufhören.
    private func armSilence(_ seconds: Double) {
        silence?.cancel()
        let item = DispatchWorkItem { [weak self] in self?.stop() }
        silence = item
        DispatchQueue.main.asyncAfter(deadline: .now() + seconds, execute: item)
    }

    private func finish(error: String?) {
        guard running else { return }
        let text = latest
        cleanUp()
        onEnd?(text, text.isEmpty ? (error ?? "nospeech") : nil)
    }

    private func cleanUp() {
        running = false
        silence?.cancel()
        silence = nil
        if engine.isRunning { engine.stop() }
        engine.inputNode.removeTap(onBus: 0)
        task?.cancel()
        task = nil
        request = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
