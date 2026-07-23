import SwiftUI

struct ContactEditView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dismiss) private var dismiss

    var contact: Contact?

    @State private var name: String
    @State private var relationship: Relationship
    @State private var cadenceDays: Int
    @State private var notes: String
    @State private var hasBirthday: Bool
    @State private var birthday: Date

    private static let cadencePresets: [(Int, String)] = [
        (3, "Every few days"), (7, "Weekly"), (14, "Every 2 weeks"),
        (30, "Monthly"), (60, "Every 2 months"), (90, "Every 3 months"),
    ]

    init(contact: Contact?) {
        self.contact = contact
        _name = State(initialValue: contact?.name ?? "")
        _relationship = State(initialValue: contact?.relationship ?? .friend)
        _cadenceDays = State(initialValue: contact?.cadenceDays ?? 14)
        _notes = State(initialValue: contact?.notes ?? "")
        _hasBirthday = State(initialValue: contact?.birthday != nil)
        _birthday = State(initialValue: Self.dateFromMMDD(contact?.birthday) ?? Date())
    }

    private static func dateFromMMDD(_ mmdd: String?) -> Date? {
        guard let mmdd, let slash = mmdd.firstIndex(of: "-") else { return nil }
        let mm = Int(mmdd[mmdd.startIndex..<slash]) ?? 1
        let dd = Int(mmdd[mmdd.index(after: slash)...]) ?? 1
        return Calendar.current.date(from: DateComponents(year: 2000, month: mm, day: dd))
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Mom, Sam, Uncle Raj…", text: $name)
                }

                Section {
                    Picker("Relationship", selection: $relationship) {
                        ForEach(Relationship.allCases, id: \.self) { Text($0.label).tag($0) }
                    }
                    Picker("Stay in touch", selection: $cadenceDays) {
                        ForEach(Self.cadencePresets, id: \.0) { value, label in
                            Text(label).tag(value)
                        }
                    }
                }

                Section {
                    Toggle("Birthday", isOn: $hasBirthday.animation())
                    if hasBirthday {
                        DatePicker("Date", selection: $birthday, displayedComponents: .date)
                            .datePickerStyle(.compact)
                    }
                }

                Section("Notes") {
                    TextField("Gift ideas, what's going on with them…", text: $notes, axis: .vertical)
                        .lineLimit(3...5)
                }
            }
            .navigationTitle(contact == nil ? "Add a person" : "Edit person")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(contact == nil ? "Add" : "Save", action: submit)
                        .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func submit() {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let notesValue = notes.trimmingCharacters(in: .whitespaces)
        let birthdayValue: String? = hasBirthday ? {
            let comps = Calendar.current.dateComponents([.month, .day], from: birthday)
            return String(format: "%02d-%02d", comps.month ?? 1, comps.day ?? 1)
        }() : nil

        if let contact {
            store.updateContact(contact.id) {
                $0.name = trimmed
                $0.relationship = relationship
                $0.cadenceDays = cadenceDays
                $0.notes = notesValue.isEmpty ? nil : notesValue
                $0.birthday = birthdayValue
            }
            toast.show("Updated", description: trimmed)
        } else {
            store.addContact(name: trimmed, relationship: relationship, cadenceDays: cadenceDays, notes: notesValue.isEmpty ? nil : notesValue, birthday: birthdayValue)
            toast.show("Added to your people", description: trimmed)
        }
        dismiss()
    }
}
