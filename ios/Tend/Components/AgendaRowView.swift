import SwiftUI

/// Renders one row of the Today agenda. Secondary actions (log a call, snooze, etc.) that
/// lived behind a hover-reveal overflow button on the web app become native swipe actions
/// and a long-press context menu here — no touch-target ever needs to be "revealed" first.
struct AgendaRowView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    var item: AgendaItem
    @State private var reschedulePickerOpen = false

    var body: some View {
        Group {
            switch item {
            case let .contact(contact, _, reason, daysUntil):
                contactRow(contact, reason: reason, daysUntil: daysUntil)
            case let .chore(chore, _):
                choreRow(chore)
            case let .task(task, _):
                taskRow(task)
            }
        }
        .sheet(isPresented: $reschedulePickerOpen) {
            if case let .task(task, _) = item {
                DatePickerSheet { dateISO in
                    reschedule(task, to: dateISO)
                }
            }
        }
    }

    // MARK: - Contact

    @ViewBuilder
    private func contactRow(_ contact: Contact, reason: String?, daysUntil: Int?) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.brandSoft)
                .frame(width: 34, height: 34)
                .overlay(
                    Text(contact.name.prefix(1))
                        .font(.system(.footnote, design: .rounded).weight(.semibold))
                        .foregroundStyle(Theme.foreground.opacity(0.7))
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(contact.name).font(.subheadline.weight(.medium)).lineLimit(1)
                Text(subtitle(reason: reason, daysUntil: daysUntil, contact: contact))
                    .font(.caption)
                    .foregroundStyle(Theme.mutedForeground)
                    .lineLimit(1)
            }

            Spacer(minLength: 8)

            Button {
                logContact(contact, type: .other, label: "reaching out")
            } label: {
                Label("Reached out", systemImage: "checkmark")
                    .font(.caption.weight(.semibold))
                    .lineLimit(1)
            }
            .buttonStyle(.bordered)
            .tint(Theme.primary)
            .controlSize(.small)
            .fixedSize()
        }
        .contentShape(Rectangle())
        .swipeActions(edge: .trailing) {
            Button {
                snoozeContact(contact)
            } label: {
                Label("Not today", systemImage: "clock")
            }
            .tint(Theme.mutedForeground)
        }
        .contextMenu {
            Button { logContact(contact, type: .call, label: "a call") } label: {
                Label("Log a call", systemImage: "phone")
            }
            Button { logContact(contact, type: .text, label: "a text") } label: {
                Label("Log a text", systemImage: "message")
            }
            Button { logContact(contact, type: .inPerson, label: "time together") } label: {
                Label("Log time together", systemImage: "person.2")
            }
            Divider()
            Button { snoozeContact(contact) } label: {
                Label("Not today", systemImage: "clock")
            }
        }
    }

    private func subtitle(reason: String?, daysUntil: Int?, contact: Contact) -> String {
        if reason == "birthday", let daysUntil {
            return "🎂 Birthday \(daysUntil == 0 ? "today" : "in \(daysUntil) days")"
        }
        return "Last touched base \(DateUtils.relativeSinceLabel(contact.lastContactAt))"
    }

    private func logContact(_ contact: Contact, type: InteractionType, label: String) {
        store.logContact(contact.id, type: type)
        toast.show("Logged \(label) with \(contact.name)", description: "You'll hear from us again in \(DateUtils.formatCadence(contact.cadenceDays)).")
    }

    private func snoozeContact(_ contact: Contact) {
        store.snoozeContact(contact.id, until: DateUtils.addDaysISO(DateUtils.todayDateISO(), 1))
        toast.show("Snoozed to tomorrow", description: contact.name, style: .info)
    }

    // MARK: - Chore

    @ViewBuilder
    private func choreRow(_ chore: Chore) -> some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(chore.title).font(.subheadline.weight(.medium)).lineLimit(1)
                Text(DateUtils.formatCadence(chore.recurrenceDays))
                    .font(.caption)
                    .foregroundStyle(Theme.mutedForeground)
                    .lineLimit(1)
            }
            Spacer(minLength: 8)
            Button {
                completeChore(chore)
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
        .swipeActions(edge: .leading) {
            Button { completeChore(chore) } label: {
                Label("Done", systemImage: "checkmark")
            }
            .tint(Theme.green)
        }
        .swipeActions(edge: .trailing) {
            Button {
                store.snoozeChore(chore.id, until: DateUtils.addDaysISO(DateUtils.todayDateISO(), 1))
                toast.show("Snoozed to tomorrow", description: chore.title, style: .info)
            } label: {
                Label("Not today", systemImage: "clock")
            }
            .tint(Theme.mutedForeground)
        }
    }

    private func completeChore(_ chore: Chore) {
        let generator = UINotificationFeedbackGenerator()
        generator.notificationOccurred(.success)
        store.completeChore(chore.id)
        let next = DateUtils.addDaysISO(DateUtils.todayDateISO(), chore.recurrenceDays)
        toast.show("Done", description: "Next up \(DateUtils.gentleDueLabel(next))")
    }

    // MARK: - Task

    @ViewBuilder
    private func taskRow(_ task: TaskItem) -> some View {
        HStack(spacing: 12) {
            Button {
                toggleTask(task)
            } label: {
                Image(systemName: task.isDone ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 21))
                    .foregroundStyle(task.isDone ? Theme.primary : Theme.mutedForeground.opacity(0.5))
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title)
                    .font(.subheadline.weight(.medium))
                    .strikethrough(task.isDone)
                    .foregroundStyle(task.isDone ? Theme.mutedForeground : Theme.foreground)
                    .lineLimit(1)
                if let dueDate = task.dueDate {
                    Text(DateUtils.gentleDueLabel(dueDate))
                        .font(.caption)
                        .foregroundStyle(Theme.mutedForeground)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 0)
        }
        .contentShape(Rectangle())
        .swipeActions(edge: .trailing) {
            Button {
                store.snoozeTask(task.id, until: DateUtils.addDaysISO(DateUtils.todayDateISO(), 1))
                toast.show("Snoozed to tomorrow", description: task.title, style: .info)
            } label: {
                Label("Not today", systemImage: "clock")
            }
            .tint(Theme.mutedForeground)
        }
        .contextMenu {
            RescheduleMenu(
                onPick: { dateISO in reschedule(task, to: dateISO) },
                onPickCustom: { reschedulePickerOpen = true }
            )
        }
    }

    private func reschedule(_ task: TaskItem, to dateISO: String) {
        store.updateTask(task.id) { $0.dueDate = dateISO }
        toast.show("Rescheduled", description: DateUtils.gentleDueLabel(dateISO))
    }

    private func toggleTask(_ task: TaskItem) {
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
