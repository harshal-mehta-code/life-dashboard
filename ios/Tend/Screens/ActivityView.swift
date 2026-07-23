import SwiftUI

/// A single unified log of everything you've tended — tasks completed, chores done, people
/// reached out to — regardless of which tab it happened in. Backed by the same `AppEvent`
/// log that already powers the streak counter; this just makes that history visible.
struct ActivityView: View {
    @Environment(AppStore.self) private var store

    private struct DayGroup: Identifiable {
        var id: String { day }
        var day: String
        var events: [AppEvent]
    }

    private var groups: [DayGroup] {
        var order: [String] = []
        var buckets: [String: [AppEvent]] = [:]
        for event in store.events {
            let day = String(event.at.prefix(10))
            if buckets[day] == nil {
                buckets[day] = []
                order.append(day)
            }
            buckets[day]?.append(event)
        }
        return order.map { DayGroup(day: $0, events: buckets[$0] ?? []) }
    }

    var body: some View {
        List {
            if groups.isEmpty {
                EmptyStateView(
                    systemImage: "clock.arrow.circlepath",
                    title: "Nothing logged yet",
                    description: "Every task, chore, and person you tend to shows up here, newest first."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                ForEach(groups) { group in
                    Section(dayLabel(group.day)) {
                        ForEach(group.events) { event in
                            HStack(spacing: 12) {
                                Image(systemName: symbol(for: event.kind))
                                    .foregroundStyle(color(for: event.kind))
                                    .frame(width: 22)
                                Text(event.label)
                                    .lineLimit(1)
                                Spacer(minLength: 8)
                                Text(timeLabel(event.at))
                                    .font(.caption)
                                    .foregroundStyle(Theme.mutedForeground)
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Activity")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func symbol(for kind: String) -> String {
        switch kind {
        case "task-done": return "checkmark.circle.fill"
        case "chore-done": return "arrow.triangle.2.circlepath"
        case "contact-logged": return "person.fill"
        default: return "circle.fill"
        }
    }

    private func color(for kind: String) -> Color {
        switch kind {
        case "task-done": return Theme.primary
        case "chore-done": return Theme.green
        case "contact-logged": return Theme.blue
        default: return Theme.mutedForeground
        }
    }

    private func dayLabel(_ day: String) -> String {
        guard let date = DateUtils.parseFlexible(day) else { return day }
        if Calendar.current.isDateInToday(date) { return "Today" }
        if Calendar.current.isDateInYesterday(date) { return "Yesterday" }
        let f = DateFormatter()
        f.setLocalizedDateFormatFromTemplate("EEEEMMMMd")
        return f.string(from: date)
    }

    private func timeLabel(_ iso: String) -> String {
        guard let date = DateUtils.parseFlexible(iso) else { return "" }
        let f = DateFormatter()
        f.timeStyle = .short
        return f.string(from: date)
    }
}
