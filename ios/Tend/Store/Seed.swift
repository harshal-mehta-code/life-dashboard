import Foundation

enum Seed {
    private static let formatter: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static func ago(_ days: Int) -> String {
        formatter.string(from: Date().addingTimeInterval(-Double(days) * 86400))
    }

    static func makeInitialData() -> PersistableData {
        let today = DateUtils.todayDateISO()
        return PersistableData(
            tasks: [
                TaskItem(id: UUID().uuidString, title: "Call the dentist to reschedule cleaning", notes: nil, category: .call, context: .phone, effort: .quick, important: true, dueDate: today, status: "open", completedAt: nil, createdAt: ago(2), snoozedUntil: nil),
                TaskItem(id: UUID().uuidString, title: "Return library books", notes: nil, category: .errand, context: .out, effort: .quick, important: false, dueDate: DateUtils.addDaysISO(today, 1), status: "open", completedAt: nil, createdAt: ago(3), snoozedUntil: nil),
                TaskItem(id: UUID().uuidString, title: "Call the plumber about the leaky faucet", notes: nil, category: .call, context: .phone, effort: .quick, important: true, dueDate: nil, status: "open", completedAt: nil, createdAt: ago(1), snoozedUntil: nil),
                TaskItem(id: UUID().uuidString, title: "Drop off dry cleaning", notes: nil, category: .errand, context: .out, effort: .quick, important: false, dueDate: nil, status: "open", completedAt: nil, createdAt: ago(5), snoozedUntil: nil),
                TaskItem(id: UUID().uuidString, title: "Look into a weekend trip for the fall", notes: nil, category: .someday, context: .computer, effort: .deep, important: false, dueDate: nil, status: "open", completedAt: nil, createdAt: ago(20), snoozedUntil: nil),
            ],
            chores: [
                Chore(id: UUID().uuidString, title: "Clean the windows", notes: nil, recurrenceDays: 90, lastDoneAt: ago(95), createdAt: ago(200), archived: nil, snoozedUntil: nil),
                Chore(id: UUID().uuidString, title: "Water the plants", notes: nil, recurrenceDays: 7, lastDoneAt: ago(8), createdAt: ago(200), archived: nil, snoozedUntil: nil),
                Chore(id: UUID().uuidString, title: "Change bed sheets", notes: nil, recurrenceDays: 14, lastDoneAt: ago(10), createdAt: ago(200), archived: nil, snoozedUntil: nil),
                Chore(id: UUID().uuidString, title: "Vacuum the living room", notes: nil, recurrenceDays: 7, lastDoneAt: ago(4), createdAt: ago(200), archived: nil, snoozedUntil: nil),
                Chore(id: UUID().uuidString, title: "Deep clean the fridge", notes: nil, recurrenceDays: 60, lastDoneAt: ago(50), createdAt: ago(200), archived: nil, snoozedUntil: nil),
                Chore(id: UUID().uuidString, title: "Change HVAC filter", notes: nil, recurrenceDays: 90, lastDoneAt: ago(100), createdAt: ago(200), archived: nil, snoozedUntil: nil),
            ],
            contacts: [
                Contact(id: UUID().uuidString, name: "Mom", relationship: .family, cadenceDays: 7, lastContactAt: ago(9), notes: nil, createdAt: ago(400), archived: nil, snoozedUntil: nil, birthday: nil),
                Contact(id: UUID().uuidString, name: "Dad", relationship: .family, cadenceDays: 14, lastContactAt: ago(6), notes: nil, createdAt: ago(400), archived: nil, snoozedUntil: nil, birthday: nil),
                Contact(id: UUID().uuidString, name: "Sam", relationship: .friend, cadenceDays: 21, lastContactAt: ago(28), notes: "Owes me a text back about the trip", createdAt: ago(200), archived: nil, snoozedUntil: nil, birthday: nil),
                Contact(id: UUID().uuidString, name: "Priya", relationship: .friend, cadenceDays: 30, lastContactAt: ago(12), notes: nil, createdAt: ago(300), archived: nil, snoozedUntil: nil, birthday: nil),
                Contact(id: UUID().uuidString, name: "Uncle Raj", relationship: .family, cadenceDays: 60, lastContactAt: ago(70), notes: nil, createdAt: ago(500), archived: nil, snoozedUntil: nil, birthday: nil),
            ],
            interactions: [],
            groceries: [
                GroceryItem(id: UUID().uuidString, name: "Milk", checked: false, createdAt: DateUtils.nowISO()),
                GroceryItem(id: UUID().uuidString, name: "Eggs", checked: false, createdAt: DateUtils.nowISO()),
                GroceryItem(id: UUID().uuidString, name: "Paper towels", checked: false, createdAt: DateUtils.nowISO()),
                GroceryItem(id: UUID().uuidString, name: "Coffee", checked: false, createdAt: DateUtils.nowISO()),
            ],
            usualGroceryItems: [],
            events: [],
            settings: AppSettings(todayBudget: 6, hasSeenWelcome: false)
        )
    }
}
