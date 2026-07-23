import SwiftUI

private enum TaskFilter: Hashable, CaseIterable {
    case all, call, errand, general, someday

    var label: String {
        switch self {
        case .all: return "All"
        case .call: return "Calls"
        case .errand: return "Errands"
        case .general: return "Other"
        case .someday: return "Someday"
        }
    }

    var category: TaskCategory? {
        switch self {
        case .all: return nil
        case .call: return .call
        case .errand: return .errand
        case .general: return .general
        case .someday: return .someday
        }
    }

    static func matching(_ category: TaskCategory) -> TaskFilter {
        switch category {
        case .call: return .call
        case .errand: return .errand
        case .general: return .general
        case .someday: return .someday
        }
    }
}

struct TasksView: View {
    @Environment(AppStore.self) private var store
    @Environment(TabRouter.self) private var router
    @State private var addOpen = false
    @State private var filter: TaskFilter = .all
    @State private var showDone = false

    private var filtered: [TaskItem] {
        guard let category = filter.category else { return store.tasks }
        return store.tasks.filter { $0.category == category }
    }
    private var open: [TaskItem] {
        filtered.filter { !$0.isDone }.sorted { $0.createdAt > $1.createdAt }
    }
    private var done: [TaskItem] {
        filtered.filter { $0.isDone }.sorted { ($0.completedAt ?? $0.createdAt) > ($1.completedAt ?? $1.createdAt) }
    }

    var body: some View {
        List {
            Section {
                Picker("Filter", selection: $filter) {
                    ForEach(TaskFilter.allCases, id: \.self) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }

            if open.isEmpty && done.isEmpty {
                EmptyStateView(
                    systemImage: "checklist",
                    title: "Nothing here",
                    description: "Add a task, or capture one quickly from the Today tab."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                if open.isEmpty {
                    Text("Nothing open in this list.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.mutedForeground)
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                        .listRowSeparator(.hidden)
                } else {
                    Section {
                        ForEach(open) { task in
                            TaskRowView(task: task)
                        }
                    }
                }

                if !done.isEmpty {
                    Section {
                        DisclosureGroup(isExpanded: $showDone) {
                            ForEach(done) { task in
                                TaskRowView(task: task)
                            }
                        } label: {
                            Text("Completed (\(done.count))")
                                .font(.subheadline)
                                .foregroundStyle(Theme.mutedForeground)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .background(Theme.background)
        .navigationTitle("Tasks")
        .navigationBarTitleDisplayMode(.large)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { addOpen = true } label: {
                    Label("Add task", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $addOpen) {
            TaskEditView(task: nil)
        }
        .onAppear {
            if let pending = router.pendingTaskFilter {
                filter = .matching(pending)
                router.pendingTaskFilter = nil
            }
        }
    }
}

private struct TaskRowView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    var task: TaskItem
    @State private var editOpen = false

    private var contextSymbol: String? {
        switch task.context {
        case .home: return "house"
        case .phone: return "phone"
        case .out: return "mappin.and.ellipse"
        case .computer: return "laptopcomputer"
        case .anywhere: return nil
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Button {
                toggle()
            } label: {
                Image(systemName: task.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 21))
                    .foregroundStyle(task.isDone ? Theme.primary : Theme.mutedForeground.opacity(0.5))
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 3) {
                Text(task.title)
                    .font(.subheadline.weight(.medium))
                    .strikethrough(task.isDone)
                    .foregroundStyle(task.isDone ? Theme.mutedForeground : Theme.foreground)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    if let symbol = contextSymbol {
                        Image(systemName: symbol).font(.caption2)
                    }
                    if task.important {
                        Label("important", systemImage: "star.fill")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Theme.primary)
                            .lineLimit(1)
                            .fixedSize()
                    }
                    if let dueDate = task.dueDate, !task.isDone {
                        Text(DateUtils.relativeDueLabel(dueDate))
                            .font(.caption2)
                            .foregroundStyle(dueDate < DateUtils.todayDateISO() ? Theme.destructive : Theme.mutedForeground)
                            .lineLimit(1)
                            .fixedSize()
                    }
                }
                .foregroundStyle(Theme.mutedForeground)
            }
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .onTapGesture { editOpen = true }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) { store.deleteTask(task.id) } label: {
                Label("Delete", systemImage: "trash")
            }
            Button { editOpen = true } label: { Label("Edit", systemImage: "pencil") }
                .tint(Theme.mutedForeground)
        }
        .sheet(isPresented: $editOpen) {
            TaskEditView(task: task)
        }
    }

    private func toggle() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
            store.toggleTaskDone(task.id)
        }
        if !task.isDone {
            toast.show("Nice work", description: task.title)
        }
    }
}
