import SwiftUI

struct QuickCaptureView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(TabRouter.self) private var router
    @State private var title = ""
    @State private var category: TaskCategory = .general
    @FocusState private var focused: Bool

    private let categories: [(TaskCategory, String, String)] = [
        (.general, "Other", "checklist"),
        (.call, "Call", "phone"),
        (.errand, "Errand", "mappin.and.ellipse"),
        (.someday, "Someday", "sparkles"),
    ]

    private let destinationLabel: [TaskCategory: String] = [
        .general: "Tasks → Other",
        .call: "Tasks → Calls",
        .errand: "Tasks → Errands",
        .someday: "Tasks → Someday",
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                TextField("Quick add anything…", text: $title)
                    .focused($focused)
                    .submitLabel(.done)
                    .onSubmit(submit)
                    .lineLimit(1)
                Button(action: submit) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 26))
                }
                .tint(Theme.primary)
                .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                .fixedSize()
            }

            HStack(spacing: 6) {
                ForEach(categories, id: \.0) { value, label, icon in
                    let active = category == value
                    Button {
                        category = value
                    } label: {
                        Label(label, systemImage: icon)
                            .font(.caption.weight(.medium))
                    }
                    .buttonStyle(.bordered)
                    .tint(active ? Theme.primary : Theme.mutedForeground)
                    .controlSize(.small)
                    .fixedSize()
                }
                Spacer(minLength: 0)
            }
        }
        .padding(.vertical, 4)
    }

    private func submit() {
        let trimmed = title.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        let context: TaskContext = category == .call ? .phone : (category == .errand ? .out : .anywhere)
        let capturedCategory = category
        let id = store.addTask(title: trimmed, category: capturedCategory, context: context)

        toast.show(
            "Added to \(destinationLabel[capturedCategory] ?? "Tasks")",
            description: trimmed,
            action: ToastAction(label: "View") {
                router.pendingTaskFilter = capturedCategory
                router.selection = .tasks
            },
            secondaryAction: capturedCategory == .someday ? nil : ToastAction(label: "Do today?") {
                store.updateTask(id) { $0.dueDate = DateUtils.todayDateISO() }
                toast.show("Moved to today", description: trimmed)
            }
        )
        title = ""
        category = .general
    }
}
