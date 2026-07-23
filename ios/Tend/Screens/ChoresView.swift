import SwiftUI

struct ChoresView: View {
    @Environment(AppStore.self) private var store
    @State private var addOpen = false

    private var due: [DueChore] { Selectors.dueChores(store.chores) }
    private var dueIds: Set<String> { Set(due.map { $0.chore.id }) }
    private var upcoming: [(chore: Chore, nextDueISO: String)] {
        store.chores
            .filter { !dueIds.contains($0.id) }
            .map { chore in
                let anchor = String((chore.lastDoneAt ?? chore.createdAt).prefix(10))
                return (chore, DateUtils.addDaysISO(anchor, chore.recurrenceDays))
            }
            .sorted { $0.nextDueISO < $1.nextDueISO }
    }

    var body: some View {
        List {
            if store.chores.isEmpty {
                EmptyStateView(
                    systemImage: "arrow.triangle.2.circlepath",
                    title: "No chores yet",
                    description: "Add the recurring things you need to keep up with — cleaning windows, watering plants, changing filters."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                if !due.isEmpty {
                    Section("Due now (\(due.count))") {
                        ForEach(due, id: \.chore.id) { d in
                            ChoreRowView(chore: d.chore, nextDueISO: d.nextDueISO, overdue: d.overdueDays > 0)
                        }
                    }
                }
                if !upcoming.isEmpty {
                    Section("Upcoming (\(upcoming.count))") {
                        ForEach(upcoming, id: \.chore.id) { u in
                            ChoreRowView(chore: u.chore, nextDueISO: u.nextDueISO, overdue: false)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .background(Theme.background)
        .navigationTitle("Chores")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { addOpen = true } label: {
                    Label("Add chore", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $addOpen) {
            ChoreEditView(chore: nil)
        }
    }
}

private struct ChoreRowView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    var chore: Chore
    var nextDueISO: String
    var overdue: Bool
    @State private var editOpen = false

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(chore.title).font(.subheadline.weight(.medium)).lineLimit(1)
                HStack(spacing: 6) {
                    Text(DateUtils.formatCadence(chore.recurrenceDays))
                    Text("·")
                    Text(DateUtils.relativeDueLabel(nextDueISO))
                        .foregroundStyle(overdue ? Theme.destructive : Theme.mutedForeground)
                }
                .font(.caption)
                .foregroundStyle(Theme.mutedForeground)
                .lineLimit(1)
            }
            Spacer(minLength: 8)
            Button {
                complete()
            } label: {
                Label("Done", systemImage: "checkmark")
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
            }
            .buttonStyle(.bordered)
            .tint(Theme.primary)
            .controlSize(.small)
            .fixedSize()
        }
        .contentShape(Rectangle())
        .onTapGesture { editOpen = true }
        .swipeActions(edge: .leading) {
            Button { complete() } label: { Label("Done", systemImage: "checkmark") }
                .tint(Theme.green)
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) { store.deleteChore(chore.id) } label: {
                Label("Delete", systemImage: "trash")
            }
            Button { editOpen = true } label: { Label("Edit", systemImage: "pencil") }
                .tint(Theme.mutedForeground)
        }
        .contextMenu {
            Button { editOpen = true } label: { Label("Edit", systemImage: "pencil") }
            Button(role: .destructive) { store.deleteChore(chore.id) } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .sheet(isPresented: $editOpen) {
            ChoreEditView(chore: chore)
        }
    }

    private func complete() {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        store.completeChore(chore.id)
        let next = DateUtils.addDaysISO(DateUtils.todayDateISO(), chore.recurrenceDays)
        toast.show("Done", description: "Next up \(DateUtils.relativeDueLabel(next))")
    }
}
