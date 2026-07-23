import SwiftUI

private enum RelationshipFilter: String, CaseIterable, Identifiable {
    case all, family, friend, work, other
    var id: String { rawValue }

    var label: String {
        switch self {
        case .all: return "All"
        case .family: return "Family"
        case .friend: return "Friends"
        case .work: return "Work"
        case .other: return "Other"
        }
    }

    var relationship: Relationship? {
        switch self {
        case .all: return nil
        case .family: return .family
        case .friend: return .friend
        case .work: return .work
        case .other: return .other
        }
    }
}

struct PeopleView: View {
    @Environment(AppStore.self) private var store
    @State private var addOpen = false
    @State private var relationshipFilter: RelationshipFilter = .all
    @State private var search = ""

    private var overdueIds: Set<String> {
        Set(Selectors.contactNudges(store.contacts).map { $0.contact.id })
    }

    private var visible: [Contact] {
        store.contacts.filter { contact in
            if let relationship = relationshipFilter.relationship, contact.relationship != relationship {
                return false
            }
            let query = search.trimmingCharacters(in: .whitespaces).lowercased()
            if !query.isEmpty && !contact.name.lowercased().contains(query) {
                return false
            }
            return true
        }
    }
    private var needsAttention: [Contact] { visible.filter { overdueIds.contains($0.id) } }
    private var onTrack: [Contact] { visible.filter { !overdueIds.contains($0.id) } }

    var body: some View {
        List {
            if !store.contacts.isEmpty {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 6) {
                            Image(systemName: "magnifyingglass").foregroundStyle(Theme.mutedForeground)
                            TextField("Search people…", text: $search)
                        }
                        Picker("Relationship", selection: $relationshipFilter) {
                            ForEach(RelationshipFilter.allCases) { f in
                                Text(f.label).tag(f)
                            }
                        }
                        .pickerStyle(.segmented)
                    }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }

            if store.contacts.isEmpty {
                EmptyStateView(
                    systemImage: "person.2",
                    title: "No one here yet",
                    description: "Add the people you want to make sure you keep in touch with, and set how often you'd like to connect."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else if visible.isEmpty {
                EmptyStateView(
                    systemImage: "magnifyingglass",
                    title: "No matches",
                    description: "Try a different name or relationship filter."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                if !needsAttention.isEmpty {
                    Section("Needs attention (\(needsAttention.count))") {
                        ForEach(needsAttention) { contact in
                            ContactRow(contact: contact, overdue: true)
                        }
                    }
                }
                if !onTrack.isEmpty {
                    Section("On track (\(onTrack.count))") {
                        ForEach(onTrack) { contact in
                            ContactRow(contact: contact, overdue: false)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .background(Theme.background)
        .navigationTitle("People")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { addOpen = true } label: {
                    Label("Add person", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $addOpen) {
            ContactEditView(contact: nil)
        }
    }
}

private struct ContactRow: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    var contact: Contact
    var overdue: Bool
    @State private var editOpen = false

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.brandSoft)
                .frame(width: 38, height: 38)
                .overlay(
                    Text(contact.name.prefix(1))
                        .font(.system(.subheadline, design: .rounded).weight(.semibold))
                        .foregroundStyle(Theme.primary)
                )

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(contact.name).font(.subheadline.weight(.medium)).lineLimit(1)
                    Text(contact.relationship.label)
                        .font(.caption2.weight(.medium))
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Capsule().fill(Theme.secondary))
                        .foregroundStyle(Theme.mutedForeground)
                        .lineLimit(1)
                        .fixedSize()
                }
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(overdue ? Theme.primary : Theme.mutedForeground)
                    .lineLimit(1)
                if let notes = contact.notes, !notes.isEmpty {
                    Text(notes)
                        .font(.caption)
                        .italic()
                        .foregroundStyle(Theme.mutedForeground.opacity(0.8))
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .onTapGesture { editOpen = true }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                store.deleteContact(contact.id)
            } label: {
                Label("Delete", systemImage: "trash")
            }
            Button { editOpen = true } label: {
                Label("Edit", systemImage: "pencil")
            }
            .tint(Theme.mutedForeground)
        }
        .swipeActions(edge: .leading) {
            Button { log(.call, "a call") } label: { Label("Call", systemImage: "phone") }
                .tint(Theme.primary)
            Button { log(.text, "a text") } label: { Label("Text", systemImage: "message") }
                .tint(Theme.blue)
        }
        .contextMenu {
            Button { log(.call, "a call") } label: { Label("Log a call", systemImage: "phone") }
            Button { log(.text, "a text") } label: { Label("Log a text", systemImage: "message") }
            Button { log(.inPerson, "time together") } label: { Label("Log time together", systemImage: "person.2") }
            Divider()
            Button { editOpen = true } label: { Label("Edit", systemImage: "pencil") }
            Button(role: .destructive) { store.deleteContact(contact.id) } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .sheet(isPresented: $editOpen) {
            ContactEditView(contact: contact)
        }
    }

    private var subtitle: String {
        var s = "Last touched base \(DateUtils.relativeSinceLabel(contact.lastContactAt)) · \(DateUtils.formatCadence(contact.cadenceDays)) goal"
        if let birthday = contact.birthday {
            s += " · 🎂 \(DateUtils.formatAnnualDate(birthday))"
        }
        return s
    }

    private func log(_ type: InteractionType, _ label: String) {
        store.logContact(contact.id, type: type)
        toast.show("Logged \(label) with \(contact.name)")
    }
}
