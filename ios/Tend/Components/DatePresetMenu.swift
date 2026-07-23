import SwiftUI

/// Shared "Reschedule" menu — quick date presets plus a "Pick a date…" custom option.
/// Meant to be embedded directly inside a `.contextMenu { }` closure.
struct RescheduleMenu: View {
    var onPick: (String) -> Void
    var onPickCustom: () -> Void

    var body: some View {
        Menu {
            Button("Today") { onPick(DateUtils.todayDateISO()) }
            Button("Tomorrow") { onPick(DateUtils.addDaysISO(DateUtils.todayDateISO(), 1)) }
            Button("This weekend") { onPick(DateUtils.thisWeekendISO()) }
            Button("Next week") { onPick(DateUtils.addDaysISO(DateUtils.todayDateISO(), 7)) }
            Button("Pick a date…") { onPickCustom() }
        } label: {
            Label("Reschedule", systemImage: "calendar.badge.clock")
        }
    }
}

/// The "Pick a date…" fallback sheet for `RescheduleMenu`.
struct DatePickerSheet: View {
    var onPick: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var selection: Date = Date()

    var body: some View {
        NavigationStack {
            DatePicker("Date", selection: $selection, displayedComponents: .date)
                .datePickerStyle(.graphical)
                .padding()
                .navigationTitle("Pick a date")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") {
                            onPick(DateUtils.dateOnlyString(from: selection))
                            dismiss()
                        }
                    }
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { dismiss() }
                    }
                }
        }
        .presentationDetents([.medium, .large])
    }
}
