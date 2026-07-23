import Foundation

/// Prioritization / selection logic ported 1:1 from the web app's `src/lib/selectors.ts`.
/// Scores are `Double` throughout to match JS floating-point arithmetic exactly.

struct ContactNudge {
    var contact: Contact
    /// positive = overdue, 0 = due today, negative = not due yet.
    var overdueDays: Int
}

struct DueChore {
    var chore: Chore
    var nextDueISO: String
    var overdueDays: Int
}

struct UpcomingBirthday {
    var contact: Contact
    var daysUntil: Int
}

/// Discriminated union mirroring the TS `AgendaItem`. Conforms to `Identifiable` with a
/// composite id (`"<kind>-<modelId>"`) so SwiftUI `ForEach` stays unique across kinds —
/// matching the web app's own `key={`${item.kind}-${item.id}`}`.
enum AgendaItem: Identifiable {
    case contact(Contact, score: Double, reason: String?, daysUntil: Int?)
    case chore(Chore, score: Double)
    case task(TaskItem, score: Double)

    var kind: String {
        switch self {
        case .contact: return "contact"
        case .chore: return "chore"
        case .task: return "task"
        }
    }

    var score: Double {
        switch self {
        case let .contact(_, score, _, _): return score
        case let .chore(_, score): return score
        case let .task(_, score): return score
        }
    }

    private var modelId: String {
        switch self {
        case let .contact(c, _, _, _): return c.id
        case let .chore(c, _): return c.id
        case let .task(t, _): return t.id
        }
    }

    var id: String { "\(kind)-\(modelId)" }
}

enum Selectors {
    static func contactNudges(_ contacts: [Contact]) -> [ContactNudge] {
        contacts
            .filter { !($0.archived ?? false) }
            .map { contact -> ContactNudge in
                let anchor = contact.lastContactAt ?? contact.createdAt
                let since = DateUtils.daysSince(anchor)
                return ContactNudge(contact: contact, overdueDays: since - contact.cadenceDays)
            }
            .filter { $0.overdueDays >= 0 }
            .sorted { $0.overdueDays > $1.overdueDays }
    }

    static func dueChores(_ chores: [Chore]) -> [DueChore] {
        chores
            .filter { !($0.archived ?? false) }
            .map { chore -> DueChore in
                let anchor = chore.lastDoneAt ?? chore.createdAt
                let nextDueISO = DateUtils.addDaysISO(String(anchor.prefix(10)), chore.recurrenceDays)
                return DueChore(chore: chore, nextDueISO: nextDueISO, overdueDays: DateUtils.daysSince(nextDueISO))
            }
            .filter { DateUtils.isPastOrToday($0.nextDueISO) }
            .sorted { $0.overdueDays > $1.overdueDays }
    }

    static func upcomingChores(_ chores: [Chore], withinDays: Int = 7) -> [DueChore] {
        let dueIds = Set(dueChores(chores).map { $0.chore.id })
        return chores
            .filter { !($0.archived ?? false) && !dueIds.contains($0.id) }
            .map { chore -> DueChore in
                let anchor = chore.lastDoneAt ?? chore.createdAt
                let nextDueISO = DateUtils.addDaysISO(String(anchor.prefix(10)), chore.recurrenceDays)
                return DueChore(chore: chore, nextDueISO: nextDueISO, overdueDays: DateUtils.daysSince(nextDueISO))
            }
            .filter { d in
                let diff = -d.overdueDays
                return diff >= 0 && diff <= withinDays
            }
            .sorted { $0.overdueDays < $1.overdueDays }
    }

    /// Contacts with a birthday within `leadDays`, soonest first.
    static func upcomingBirthdays(_ contacts: [Contact], leadDays: Int = 7) -> [UpcomingBirthday] {
        contacts
            .filter { !($0.archived ?? false) && $0.birthday != nil }
            .compactMap { contact -> UpcomingBirthday? in
                guard let birthday = contact.birthday,
                      let daysUntil = DateUtils.daysUntilAnnual(birthday) else { return nil }
                return UpcomingBirthday(contact: contact, daysUntil: daysUntil)
            }
            .filter { $0.daysUntil <= leadDays }
            .sorted { $0.daysUntil < $1.daysUntil }
    }

    /// One calm, globally-capped stream for the Today view — merges people nudges,
    /// due chores, and tasks into a single prioritized list instead of three
    /// separately-uncapped sections. Higher score = surfaces first.
    static func todayAgenda(
        contacts: [Contact],
        chores: [Chore],
        tasks: [TaskItem],
        budget: Int
    ) -> [AgendaItem] {
        let today = DateUtils.todayDateISO()

        func isSnoozed(_ snoozedUntil: String?) -> Bool {
            guard let snoozedUntil else { return false }
            return snoozedUntil > today
        }

        let cadenceItems: [AgendaItem] = contactNudges(contacts)
            .filter { !isSnoozed($0.contact.snoozedUntil) }
            .map { n in
                .contact(n.contact, score: 150 + Double(min(n.overdueDays, 60)), reason: nil, daysUntil: nil)
            }

        let cadenceIds = Set(cadenceItems.map { $0.id })
        let birthdayItems: [AgendaItem] = upcomingBirthdays(contacts)
            .filter { b in
                !cadenceIds.contains("contact-\(b.contact.id)") && !isSnoozed(b.contact.snoozedUntil)
            }
            .map { b in
                .contact(
                    b.contact,
                    score: 250 + Double(7 - b.daysUntil) * 10,
                    reason: "birthday",
                    daysUntil: b.daysUntil
                )
            }

        let contactItems = cadenceItems + birthdayItems

        let choreItems: [AgendaItem] = dueChores(chores)
            .filter { !isSnoozed($0.chore.snoozedUntil) }
            .map { d in
                .chore(d.chore, score: 140 + Double(min(d.overdueDays, 60)))
            }

        let openTasks = tasks.filter { t in
            t.status == "open" && t.category != .someday && !isSnoozed(t.snoozedUntil)
        }

        let taskItems: [AgendaItem] = openTasks.map { t in
            let score: Double
            if let dueDate = t.dueDate, dueDate <= today {
                let overdueDays = DateUtils.daysSince(dueDate)
                score = 300 + Double(min(overdueDays, 60)) * 5
            } else if t.important {
                score = 100
            } else {
                let ageDays = DateUtils.daysSince(t.createdAt)
                score = 10 + Double(min(ageDays, 30)) * 0.2
            }
            return .task(t, score: score)
        }

        return (contactItems + choreItems + taskItems)
            .sorted { $0.score > $1.score }
            .prefix(budget)
            .map { $0 }
    }

    /// Rough total minutes for the agenda shown — bounds the day into a finishable commitment.
    static func estimateAgendaMinutes(_ agenda: [AgendaItem]) -> Int {
        agenda.reduce(0) { sum, item in
            switch item {
            case let .task(t, _): return sum + t.effort.minutes
            case .chore: return sum + 10
            case .contact: return sum + 5
            }
        }
    }

    /// Consecutive days (ending today or yesterday) with at least one tended event.
    static func currentStreak(_ events: [AppEvent]) -> Int {
        if events.isEmpty { return 0 }
        let days = Set(events.map { String($0.at.prefix(10)) })
        var streak = 0
        var cursor = DateUtils.todayDateISO()
        if !days.contains(cursor) {
            let yesterday = DateUtils.addDaysISO(cursor, -1)
            if !days.contains(yesterday) { return 0 }
            cursor = yesterday
        }
        while days.contains(cursor) {
            streak += 1
            cursor = DateUtils.addDaysISO(cursor, -1)
        }
        return streak
    }
}
