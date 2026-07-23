import Foundation

enum TaskCategory: String, Codable, CaseIterable {
    case errand, call, someday, general
}

enum TaskContext: String, Codable, CaseIterable {
    case home, phone, out, computer, anywhere
}

enum Effort: String, Codable, CaseIterable {
    case quick, medium, deep

    var label: String {
        switch self {
        case .quick: return "Quick"
        case .medium: return "Medium"
        case .deep: return "Deep"
        }
    }

    var minutes: Int {
        switch self {
        case .quick: return 5
        case .medium: return 15
        case .deep: return 40
        }
    }
}

enum Relationship: String, Codable, CaseIterable {
    case family, friend, work, other

    var label: String { rawValue.capitalized }
}

enum InteractionType: String, Codable {
    case call, text, inPerson = "in-person", email, other
}

struct TaskItem: Identifiable, Codable, Equatable {
    var id: String
    var title: String
    var notes: String?
    var category: TaskCategory
    var context: TaskContext
    var effort: Effort
    var important: Bool
    var dueDate: String? // yyyy-MM-dd
    var status: String // "open" | "done"
    var completedAt: String?
    var createdAt: String // full ISO datetime
    var snoozedUntil: String? // yyyy-MM-dd

    var isDone: Bool { status == "done" }
}

struct Chore: Identifiable, Codable, Equatable {
    var id: String
    var title: String
    var notes: String?
    var recurrenceDays: Int
    var lastDoneAt: String? // full ISO datetime
    var createdAt: String // full ISO datetime
    var archived: Bool?
    var snoozedUntil: String? // yyyy-MM-dd
}

struct Contact: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var relationship: Relationship
    var cadenceDays: Int
    var lastContactAt: String? // full ISO datetime
    var notes: String?
    var createdAt: String // full ISO datetime
    var archived: Bool?
    var snoozedUntil: String? // yyyy-MM-dd
    var birthday: String? // "MM-DD"
}

struct InteractionLog: Identifiable, Codable, Equatable {
    var id: String
    var contactId: String
    var date: String // full ISO datetime
    var type: InteractionType
    var note: String?
}

struct GroceryItem: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var checked: Bool
    var createdAt: String
}

struct AppSettings: Codable, Equatable {
    var todayBudget: Int
    var hasSeenWelcome: Bool
}

struct AppEvent: Identifiable, Codable, Equatable {
    var id: String
    var kind: String // "task-done" | "chore-done" | "contact-logged"
    var refId: String
    var label: String
    var at: String // full ISO datetime
}

struct PersistableData: Codable {
    var tasks: [TaskItem]
    var chores: [Chore]
    var contacts: [Contact]
    var interactions: [InteractionLog]
    var groceries: [GroceryItem]
    var usualGroceryItems: [String]
    var events: [AppEvent]
    var settings: AppSettings
}
