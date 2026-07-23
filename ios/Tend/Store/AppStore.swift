import Foundation
import Observation

/// Single source of truth for all app data, persisted as one JSON blob to UserDefaults —
/// mirrors the web app's zustand `persist` store (localStorage key "life-dashboard-storage-v1").
/// Keeping the JSON shape identical to `PersistableData` on the web side means an export from
/// one app can be imported into the other.
@Observable
final class AppStore {
    static let storageKey = "life-dashboard-storage-v1"

    var tasks: [TaskItem]
    var chores: [Chore]
    var contacts: [Contact]
    var interactions: [InteractionLog]
    var groceries: [GroceryItem]
    var usualGroceryItems: [String]
    var events: [AppEvent]
    var settings: AppSettings

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        if let data = defaults.data(forKey: Self.storageKey),
           let decoded = try? JSONDecoder().decode(PersistableData.self, from: data) {
            tasks = decoded.tasks
            chores = decoded.chores
            contacts = decoded.contacts
            interactions = decoded.interactions
            groceries = decoded.groceries
            usualGroceryItems = decoded.usualGroceryItems
            events = decoded.events
            settings = decoded.settings
        } else {
            let seed = Seed.makeInitialData()
            tasks = seed.tasks
            chores = seed.chores
            contacts = seed.contacts
            interactions = seed.interactions
            groceries = seed.groceries
            usualGroceryItems = seed.usualGroceryItems
            events = seed.events
            settings = seed.settings
        }
    }

    private func persist() {
        let snapshot = PersistableData(
            tasks: tasks, chores: chores, contacts: contacts, interactions: interactions,
            groceries: groceries, usualGroceryItems: usualGroceryItems, events: events, settings: settings
        )
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        defaults.set(data, forKey: Self.storageKey)
    }

    // MARK: - Tasks

    @discardableResult
    func addTask(title: String, notes: String? = nil, category: TaskCategory = .general, context: TaskContext = .anywhere, effort: Effort = .medium, important: Bool = false, dueDate: String? = nil) -> String {
        let id = UUID().uuidString
        let task = TaskItem(id: id, title: title, notes: notes, category: category, context: context, effort: effort, important: important, dueDate: dueDate, status: "open", completedAt: nil, createdAt: DateUtils.nowISO(), snoozedUntil: nil)
        tasks.insert(task, at: 0)
        persist()
        return id
    }

    func updateTask(_ id: String, _ mutate: (inout TaskItem) -> Void) {
        guard let idx = tasks.firstIndex(where: { $0.id == id }) else { return }
        mutate(&tasks[idx])
        persist()
    }

    func toggleTaskDone(_ id: String) {
        guard let idx = tasks.firstIndex(where: { $0.id == id }) else { return }
        let completing = tasks[idx].status == "open"
        if completing {
            tasks[idx].status = "done"
            tasks[idx].completedAt = DateUtils.nowISO()
            events.insert(AppEvent(id: UUID().uuidString, kind: "task-done", refId: id, label: tasks[idx].title, at: DateUtils.nowISO()), at: 0)
        } else {
            tasks[idx].status = "open"
            tasks[idx].completedAt = nil
        }
        persist()
    }

    func snoozeTask(_ id: String, until dateISO: String) {
        updateTask(id) { $0.snoozedUntil = dateISO }
    }

    func deleteTask(_ id: String) {
        tasks.removeAll { $0.id == id }
        persist()
    }

    // MARK: - Chores

    func addChore(title: String, notes: String? = nil, recurrenceDays: Int) {
        let chore = Chore(id: UUID().uuidString, title: title, notes: notes, recurrenceDays: recurrenceDays, lastDoneAt: nil, createdAt: DateUtils.nowISO(), archived: nil, snoozedUntil: nil)
        chores.insert(chore, at: 0)
        persist()
    }

    func updateChore(_ id: String, _ mutate: (inout Chore) -> Void) {
        guard let idx = chores.firstIndex(where: { $0.id == id }) else { return }
        mutate(&chores[idx])
        persist()
    }

    func completeChore(_ id: String) {
        guard let idx = chores.firstIndex(where: { $0.id == id }) else { return }
        chores[idx].lastDoneAt = DateUtils.nowISO()
        events.insert(AppEvent(id: UUID().uuidString, kind: "chore-done", refId: id, label: chores[idx].title, at: DateUtils.nowISO()), at: 0)
        persist()
    }

    func snoozeChore(_ id: String, until dateISO: String) {
        updateChore(id) { $0.snoozedUntil = dateISO }
    }

    func deleteChore(_ id: String) {
        chores.removeAll { $0.id == id }
        persist()
    }

    // MARK: - Contacts

    func addContact(name: String, relationship: Relationship, cadenceDays: Int, notes: String? = nil, birthday: String? = nil) {
        let contact = Contact(id: UUID().uuidString, name: name, relationship: relationship, cadenceDays: cadenceDays, lastContactAt: nil, notes: notes, createdAt: DateUtils.nowISO(), archived: nil, snoozedUntil: nil, birthday: birthday)
        contacts.insert(contact, at: 0)
        persist()
    }

    func updateContact(_ id: String, _ mutate: (inout Contact) -> Void) {
        guard let idx = contacts.firstIndex(where: { $0.id == id }) else { return }
        mutate(&contacts[idx])
        persist()
    }

    func logContact(_ id: String, type: InteractionType, note: String? = nil) {
        guard let idx = contacts.firstIndex(where: { $0.id == id }) else { return }
        let date = DateUtils.nowISO()
        contacts[idx].lastContactAt = date
        interactions.insert(InteractionLog(id: UUID().uuidString, contactId: id, date: date, type: type, note: note), at: 0)
        events.insert(AppEvent(id: UUID().uuidString, kind: "contact-logged", refId: id, label: contacts[idx].name, at: date), at: 0)
        persist()
    }

    func snoozeContact(_ id: String, until dateISO: String) {
        updateContact(id) { $0.snoozedUntil = dateISO }
    }

    func deleteContact(_ id: String) {
        contacts.removeAll { $0.id == id }
        interactions.removeAll { $0.contactId == id }
        persist()
    }

    // MARK: - Groceries

    func addGroceryItem(_ name: String) {
        groceries.insert(GroceryItem(id: UUID().uuidString, name: name, checked: false, createdAt: DateUtils.nowISO()), at: 0)
        persist()
    }

    func toggleGroceryItem(_ id: String) {
        guard let idx = groceries.firstIndex(where: { $0.id == id }) else { return }
        groceries[idx].checked.toggle()
        persist()
    }

    func deleteGroceryItem(_ id: String) {
        groceries.removeAll { $0.id == id }
        persist()
    }

    func clearCheckedGroceries() {
        groceries.removeAll { $0.checked }
        persist()
    }

    func toggleUsualGroceryItem(_ name: String) {
        let key = name.trimmingCharacters(in: .whitespaces).lowercased()
        if let idx = usualGroceryItems.firstIndex(where: { $0.lowercased() == key }) {
            usualGroceryItems.remove(at: idx)
        } else {
            usualGroceryItems.append(name.trimmingCharacters(in: .whitespaces))
        }
        persist()
    }

    func addUsualToList(_ name: String) {
        let key = name.trimmingCharacters(in: .whitespaces).lowercased()
        if groceries.contains(where: { !$0.checked && $0.name.lowercased() == key }) {
            return
        }
        if let idx = groceries.firstIndex(where: { $0.checked && $0.name.lowercased() == key }) {
            groceries[idx].checked = false
            persist()
            return
        }
        groceries.insert(GroceryItem(id: UUID().uuidString, name: name.trimmingCharacters(in: .whitespaces), checked: false, createdAt: DateUtils.nowISO()), at: 0)
        persist()
    }

    // MARK: - Settings

    func updateSettings(_ mutate: (inout AppSettings) -> Void) {
        mutate(&settings)
        persist()
    }

    // MARK: - Backup

    func exportJSON() -> Data? {
        let snapshot = PersistableData(
            tasks: tasks, chores: chores, contacts: contacts, interactions: interactions,
            groceries: groceries, usualGroceryItems: usualGroceryItems, events: events, settings: settings
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return try? encoder.encode(snapshot)
    }

    func importData(_ data: PersistableData) {
        tasks = data.tasks
        chores = data.chores
        contacts = data.contacts
        interactions = data.interactions
        groceries = data.groceries
        usualGroceryItems = data.usualGroceryItems
        events = data.events
        settings = data.settings
        persist()
    }

    func resetToSeed() {
        importData(Seed.makeInitialData())
    }
}
