import SwiftUI

struct TodayView: View {
    @Environment(AppStore.self) private var store
    @Environment(TabRouter.self) private var router
    @State private var focusMode = false
    @State private var settingsOpen = false
    @State private var activityOpen = false

    private var agenda: [AgendaItem] {
        Selectors.todayAgenda(contacts: store.contacts, chores: store.chores, tasks: store.tasks, budget: store.settings.todayBudget)
    }
    private var streak: Int { Selectors.currentStreak(store.events) }
    private var minutes: Int { Selectors.estimateAgendaMinutes(agenda) }
    private var groceriesLeft: Int { store.groceries.filter { !$0.checked }.count }

    private var todayLabel: String {
        let f = DateFormatter()
        f.setLocalizedDateFormatFromTemplate("EEEEMMMMd")
        return f.string(from: Date())
    }

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case ..<5: return "Still up?"
        case ..<12: return "Good morning"
        case ..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(greeting)
                        .font(.system(.title2, design: .rounded).weight(.semibold))
                    Text(agenda.isEmpty ? todayLabel : "\(todayLabel) · about \(minutes) minutes today")
                        .font(.subheadline)
                        .foregroundStyle(Theme.mutedForeground)
                }
                QuickCaptureView()
                    .padding(12)
                    .cardSurface()
            }
            .padding(.horizontal, 16)
            .padding(.top, 8)
            .padding(.bottom, 4)

            agendaList
        }
        .background(Theme.background)
        .navigationTitle("Tend")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 6) {
                    if streak >= 2 {
                        Button {
                            activityOpen = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: streak >= 10 ? "tree.fill" : streak >= 5 ? "camera.macro" : "leaf.fill")
                                Text("\(streak) days")
                            }
                            .font(.caption.weight(.medium))
                            .foregroundStyle(Theme.primary)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Capsule().fill(Theme.primary.opacity(0.12)))
                        }
                    }
                    Button {
                        settingsOpen = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
        }
        .sheet(isPresented: $settingsOpen) {
            SettingsView()
        }
        .sheet(isPresented: $activityOpen) {
            NavigationStack { ActivityView() }
        }
    }

    @ViewBuilder
    private var agendaList: some View {
        List {
            if agenda.isEmpty {
                EmptyStateView(
                    systemImage: "leaf.fill",
                    title: "You've tended everything",
                    description: "Nothing needs you right now. A good moment to get ahead on Someday, or just rest."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                Section {
                    if agenda.count > 1 {
                        Picker("View", selection: $focusMode) {
                            Text("List").tag(false)
                            Text("Focus").tag(true)
                        }
                        .pickerStyle(.segmented)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }

                    if focusMode && agenda.count > 1 {
                        AgendaRowView(item: agenda[0])
                        Text("Just this — \(agenda.count - 1) more after it")
                            .font(.caption)
                            .foregroundStyle(Theme.mutedForeground)
                            .listRowSeparator(.hidden)
                    } else {
                        ForEach(agenda) { item in
                            AgendaRowView(item: item)
                        }
                    }
                }
            }

            if groceriesLeft > 0 {
                Section {
                    Button {
                        router.selection = .groceries
                    } label: {
                        HStack {
                            Label("\(groceriesLeft) item\(groceriesLeft == 1 ? "" : "s") on your grocery list", systemImage: "basket")
                                .foregroundStyle(Theme.mutedForeground)
                            Spacer(minLength: 8)
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(Theme.mutedForeground.opacity(0.6))
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .listSectionSpacing(.compact)
        .contentMargins(.top, 4, for: .scrollContent)
    }
}
