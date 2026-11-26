import MessageUI
import UIKit

/// Öffnet eine fertige Mail im Konto der Mail-App (z. B. Web.de). Ohne Konto dort: Teilen-Menü.
@MainActor
final class MailSender: NSObject, MFMailComposeViewControllerDelegate {
    private var pending: ((String) -> Void)?

    func send(
        from host: UIViewController, subject: String, body: String, to: String,
        pdf: Data?, fileName: String, done: @escaping (String) -> Void
    ) {
        finish("cancelled")
        pending = done

        if MFMailComposeViewController.canSendMail() {
            let mail = MFMailComposeViewController()
            mail.mailComposeDelegate = self
            mail.setSubject(subject)
            mail.setMessageBody(body, isHTML: false)
            if !to.isEmpty { mail.setToRecipients([to]) }
            if let pdf = pdf { mail.addAttachmentData(pdf, mimeType: "application/pdf", fileName: fileName) }
            host.present(mail, animated: true)
            return
        }

        var items: [Any] = [subject + "\n\n" + body]
        if let pdf = pdf {
            let file = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)
            if (try? pdf.write(to: file)) != nil { items.append(file) }
        }
        let share = UIActivityViewController(activityItems: items, applicationActivities: nil)
        share.popoverPresentationController?.sourceView = host.view
        share.completionWithItemsHandler = { [weak self] _, completed, _, _ in
            Task { @MainActor in self?.finish(completed ? "shared" : "cancelled") }
        }
        host.present(share, animated: true)
    }

    func mailComposeController(
        _ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?
    ) {
        controller.dismiss(animated: true)
        switch result {
        case .sent: finish("sent")
        case .saved: finish("saved")
        case .cancelled: finish("cancelled")
        default: finish("failed")
        }
    }

    private func finish(_ result: String) {
        let done = pending
        pending = nil
        done?(result)
    }
}
