import SwiftUI

struct ChoreEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dismiss) private var dismiss

    var chore: Chore?

    @State private var title: String
    @State private var recurrenceDays: Int
    @State private var notes: String

    private static let presets: [(Int, String)] = [
        (1, "Daily"), (3, "Every 3 days"), (7, "Weekly"), (14, "Every 2 weeks"),
        (30, "Monthly"), (60, "Every 2 months"), (90, "Every 3 months"),
        (180, "Every 6 months"), (365, "Yearly"),
    ]

    init(chore: Chore?) {
        self.chore = chore
        _title = State(initialValue: chore?.title ?? "")
        _recurrenceDays = State(initialValue: chore?.recurrenceDays ?? 30)
        _notes = State(initialValue: chore?.notes ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Clean the windows, water the plants…", text: $title)
                }
                Section {
                    Picker("How often", selection: $recurrenceDays) {
                        ForEach(Self.presets, id: \.0) { value, label in
                            Text(label).tag(value)
                        }
                    }
                }
                Section("Notes") {
                    TextField("Supplies needed, how you like it done…", text: $notes, axis: .vertical)
                        .lineLimit(3...5)
                }
            }
            .navigationTitle(chore == nil ? "Add a recurring chore" : "Edit chore")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(chore == nil ? "Add" : "Save", action: submit)
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func submit() {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let notesValue = notes.trimmingCharacters(in: .whitespaces)
        if let chore {
            store.updateChore(chore.id) {
                $0.title = trimmed
                $0.recurrenceDays = recurrenceDays
                $0.notes = notesValue.isEmpty ? nil : notesValue
            }
            toast.show("Updated", description: trimmed)
        } else {
            store.addChore(title: trimmed, notes: notesValue.isEmpty ? nil : notesValue, recurrenceDays: recurrenceDays)
            toast.show("Added to your chores", description: trimmed)
        }
        dismiss()
    }
}
