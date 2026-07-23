import SwiftUI

struct TaskEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dismiss) private var dismiss

    var task: TaskItem?
    var defaultCategory: TaskCategory?

    @State private var title: String
    @State private var notes: String
    @State private var category: TaskCategory
    @State private var context: TaskContext
    @State private var effort: Effort
    @State private var important: Bool
    @State private var hasDueDate: Bool
    @State private var dueDate: Date

    init(task: TaskItem?, defaultCategory: TaskCategory? = nil) {
        self.task = task
        self.defaultCategory = defaultCategory
        _title = State(initialValue: task?.title ?? "")
        _notes = State(initialValue: task?.notes ?? "")
        _category = State(initialValue: task?.category ?? defaultCategory ?? .general)
        _context = State(initialValue: task?.context ?? .anywhere)
        _effort = State(initialValue: task?.effort ?? .medium)
        _important = State(initialValue: task?.important ?? false)
        _hasDueDate = State(initialValue: task?.dueDate != nil)
        _dueDate = State(initialValue: task?.dueDate.flatMap { DateUtils.parseFlexible($0) } ?? Date())
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Call the vet, return the package…", text: $title)
                }

                Section {
                    Picker("List", selection: $category) {
                        Text("Other").tag(TaskCategory.general)
                        Text("Call").tag(TaskCategory.call)
                        Text("Errand").tag(TaskCategory.errand)
                        Text("Someday").tag(TaskCategory.someday)
                    }
                    Picker("Where / how", selection: $context) {
                        Text("Anywhere").tag(TaskContext.anywhere)
                        Text("At home").tag(TaskContext.home)
                        Text("On the phone").tag(TaskContext.phone)
                        Text("Out & about").tag(TaskContext.out)
                        Text("At the computer").tag(TaskContext.computer)
                    }
                    Picker("Effort", selection: $effort) {
                        Text("Quick (~5 min)").tag(Effort.quick)
                        Text("Medium").tag(Effort.medium)
                        Text("Deep focus").tag(Effort.deep)
                    }
                }

                Section {
                    Toggle("Due date", isOn: $hasDueDate.animation())
                    if hasDueDate {
                        DatePicker("Date", selection: $dueDate, displayedComponents: .date)
                            .datePickerStyle(.compact)
                    }
                    Toggle("Mark as important", isOn: $important)
                }

                Section("Notes") {
                    TextField("Anything else to remember", text: $notes, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle(task == nil ? "Add a task" : "Edit task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(task == nil ? "Add" : "Save", action: submit)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func submit() {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let notesValue = notes.trimmingCharacters(in: .whitespaces)
        let dueDateValue: String? = hasDueDate ? DateUtils.dateOnlyString(from: dueDate) : nil

        if let task {
            store.updateTask(task.id) {
                $0.title = trimmed
                $0.notes = notesValue.isEmpty ? nil : notesValue
                $0.category = category
                $0.context = context
                $0.effort = effort
                $0.important = important
                $0.dueDate = dueDateValue
            }
            toast.show("Updated", description: trimmed)
        } else {
            store.addTask(title: trimmed, notes: notesValue.isEmpty ? nil : notesValue, category: category, context: context, effort: effort, important: important, dueDate: dueDateValue)
            toast.show("Added", description: trimmed)
        }
        dismiss()
    }
}
