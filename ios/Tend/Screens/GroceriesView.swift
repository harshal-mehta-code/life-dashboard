import SwiftUI

struct GroceriesView: View {
    @Environment(AppStore.self) private var store
    @State private var newItemName = ""
    @FocusState private var fieldFocused: Bool

    private var unchecked: [GroceryItem] { store.groceries.filter { !$0.checked } }
    private var checked: [GroceryItem] { store.groceries.filter { $0.checked } }

    private func isUsual(_ name: String) -> Bool {
        store.usualGroceryItems.contains { $0.lowercased() == name.lowercased() }
    }

    private var availableUsuals: [String] {
        store.usualGroceryItems.filter { usual in
            !unchecked.contains { $0.name.lowercased() == usual.lowercased() }
        }
    }

    var body: some View {
        List {
            Section {
                HStack(spacing: 8) {
                    TextField("Add an item…", text: $newItemName)
                        .focused($fieldFocused)
                        .submitLabel(.done)
                        .onSubmit(submit)
                        .lineLimit(1)
                    Button(action: submit) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 26))
                    }
                    .tint(Theme.primary)
                    .disabled(newItemName.trimmingCharacters(in: .whitespaces).isEmpty)
                    .fixedSize()
                }
                .listRowBackground(Theme.card)
            }

            if !availableUsuals.isEmpty {
                Section {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 6) {
                            Text("Usuals:")
                                .font(.caption)
                                .foregroundStyle(Theme.mutedForeground)
                            ForEach(availableUsuals, id: \.self) { usual in
                                Button {
                                    withAnimation { store.addUsualToList(usual) }
                                } label: {
                                    Label(usual, systemImage: "plus")
                                        .font(.caption.weight(.medium))
                                        .labelStyle(.titleAndIcon)
                                }
                                .buttonStyle(.bordered)
                                .tint(Theme.mutedForeground)
                                .controlSize(.small)
                            }
                        }
                    }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            }

            if store.groceries.isEmpty {
                EmptyStateView(
                    systemImage: "basket",
                    title: "Your list is empty",
                    description: "Add items as you think of them, and pull this up whenever you're at the store."
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
            } else {
                if !unchecked.isEmpty {
                    Section {
                        ForEach(unchecked) { item in
                            GroceryRow(item: item, isUsual: isUsual(item.name))
                        }
                    }
                }

                if !checked.isEmpty {
                    Section {
                        ForEach(checked) { item in
                            GroceryRow(item: item, isUsual: isUsual(item.name))
                        }
                    } header: {
                        HStack {
                            Text("In your cart (\(checked.count))")
                            Spacer()
                            Button("Clear") {
                                withAnimation { store.clearCheckedGroceries() }
                            }
                            .font(.caption)
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Groceries")
        .navigationBarTitleDisplayMode(.large)
        .background(Theme.background)
    }

    private func submit() {
        let trimmed = newItemName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        withAnimation { store.addGroceryItem(trimmed) }
        newItemName = ""
    }
}

private struct GroceryRow: View {
    @Environment(AppStore.self) private var store
    var item: GroceryItem
    var isUsual: Bool

    var body: some View {
        HStack(spacing: 12) {
            Button {
                let generator = UIImpactFeedbackGenerator(style: .light)
                generator.impactOccurred()
                withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                    store.toggleGroceryItem(item.id)
                }
            } label: {
                Image(systemName: item.checked ? "checkmark.circle.fill" : "circle")
                    .font(.system(size: 21))
                    .foregroundStyle(item.checked ? Theme.primary : Theme.mutedForeground.opacity(0.5))
            }
            .buttonStyle(.plain)

            Text(item.name)
                .strikethrough(item.checked)
                .foregroundStyle(item.checked ? Theme.mutedForeground : Theme.foreground)

            Spacer()

            if isUsual {
                Image(systemName: "star.fill")
                    .font(.caption)
                    .foregroundStyle(Theme.gold)
            }
        }
        .contentShape(Rectangle())
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                withAnimation { store.deleteGroceryItem(item.id) }
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            Button {
                withAnimation { store.toggleUsualGroceryItem(item.name) }
            } label: {
                Label(isUsual ? "Unstar" : "Star", systemImage: isUsual ? "star.slash.fill" : "star.fill")
            }
            .tint(Theme.gold)
        }
    }
}
