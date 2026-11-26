import EventKit

/// Liest die heutigen Termine und trägt Gedanken mit Termin als ganztägige Einträge ein.
final class CalendarService {
    private let store = EKEventStore()

    var status: String {
        switch EKEventStore.authorizationStatus(for: .event) {
        case .fullAccess: return "granted"
        case .notDetermined: return "unknown"
        default: return "denied"
        }
    }

    func requestAccess(_ done: @escaping (Bool) -> Void) {
        if status == "granted" { done(true); return }
        store.requestFullAccessToEvents { granted, _ in
            DispatchQueue.main.async { done(granted) }
        }
    }

    func today() -> [[String: Any]] {
        guard status == "granted" else { return [] }
        let calendar = Calendar.current
        let start = calendar.startOfDay(for: Date())
        guard let end = calendar.date(byAdding: .day, value: 1, to: start) else { return [] }
        let clock = DateFormatter()
        clock.dateFormat = "HH:mm"
        let events = store.events(matching: store.predicateForEvents(withStart: start, end: end, calendars: nil))
        return events.sorted { $0.startDate < $1.startDate }.map { event in
            let time = event.isAllDay ? "Ganztägig" : clock.string(from: event.startDate) + "–" + clock.string(from: event.endDate)
            let item: [String: Any] = [
                "id": event.eventIdentifier ?? "",
                "title": event.title ?? "Termin",
                "time": time,
                "allDay": event.isAllDay
            ]
            return item
        }
    }

    func add(title: String, due: String, notes: String) throws -> String {
        guard status == "granted", let day = Self.day(due), let target = store.defaultCalendarForNewEvents else {
            throw NSError(domain: "Gedanken", code: 3)
        }
        let event = EKEvent(eventStore: store)
        event.calendar = target
        event.title = title
        event.notes = notes
        event.isAllDay = true
        event.startDate = day
        event.endDate = day
        try store.save(event, span: .thisEvent, commit: true)
        return event.eventIdentifier ?? ""
    }

    func update(id: String, title: String, due: String) throws {
        guard status == "granted", let event = store.event(withIdentifier: id), let day = Self.day(due) else {
            throw NSError(domain: "Gedanken", code: 4)
        }
        event.title = title
        event.startDate = day
        event.endDate = day
        try store.save(event, span: .thisEvent, commit: true)
    }

    func remove(id: String) {
        guard status == "granted", let event = store.event(withIdentifier: id) else { return }
        try? store.remove(event, span: .thisEvent, commit: true)
    }

    private static func day(_ iso: String) -> Date? {
        let parser = DateFormatter()
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.dateFormat = "yyyy-MM-dd"
        return parser.date(from: iso)
    }
}
