import SwiftUI
import UniformTypeIdentifiers

struct JSONFile: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data

    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws {
        data = configuration.file.regularFileContents ?? Data()
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: data)
    }
}

struct SettingsView: View {
    @Environment(AppStore.self) private var store
    @Environment(ToastCenter.self) private var toast
    @Environment(\.dismiss) private var dismiss

    @State private var exportDocument: JSONFile?
    @State private var showExporter = false
    @State private var showImporter = false
    @State private var pendingImport: PersistableData?
    @State private var showReplaceConfirm = false
    @State private var importError: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    NavigationLink {
                        ActivityView()
                    } label: {
                        Label("Activity", systemImage: "clock.arrow.circlepath")
                    }
                } footer: {
                    Text("Everything you've tended — tasks, chores, and people — in one running log.")
                }

                Section {
                    Stepper(value: Binding(
                        get: { store.settings.todayBudget },
                        set: { newValue in store.updateSettings { $0.todayBudget = newValue } }
                    ), in: 1...12) {
                        Text("Show up to \(store.settings.todayBudget) things a day")
                    }
                } footer: {
                    Text("Caps how much the Today tab asks of you at once.")
                }

                Section {
                    Button {
                        if let data = store.exportJSON() {
                            exportDocument = JSONFile(data: data)
                            showExporter = true
                        }
                    } label: {
                        Label("Export data (.json)", systemImage: "square.and.arrow.up")
                    }

                    Button {
                        showImporter = true
                    } label: {
                        Label("Import data (.json)", systemImage: "square.and.arrow.down")
                    }
                } footer: {
                    Text("Everything lives on this device only, for now. Export a backup, or restore one on a new device.")
                }
            }
            .navigationTitle("Your data")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .fileExporter(
                isPresented: $showExporter,
                document: exportDocument,
                contentType: .json,
                defaultFilename: "tend-backup-\(DateUtils.todayDateISO())"
            ) { result in
                switch result {
                case .success: toast.show("Exported", description: "Saved as a .json file.")
                case .failure: importError = "Couldn't save the export."
                }
            }
            .fileImporter(isPresented: $showImporter, allowedContentTypes: [.json]) { result in
                handleImportPick(result)
            }
            .confirmationDialog(
                "This replaces everything currently in Tend with this backup. Continue?",
                isPresented: $showReplaceConfirm,
                titleVisibility: .visible
            ) {
                Button("Replace my data", role: .destructive) {
                    if let pendingImport {
                        store.importData(pendingImport)
                        toast.show("Restored", description: "Your data has been imported.")
                        dismiss()
                    }
                }
                Button("Cancel", role: .cancel) { pendingImport = nil }
            }
            .alert("Couldn't read that file", isPresented: .constant(importError != nil), actions: {
                Button("OK") { importError = nil }
            }, message: {
                Text(importError ?? "")
            })
        }
    }

    private func handleImportPick(_ result: Result<URL, Error>) {
        guard case let .success(url) = result else {
            importError = "Make sure it's a Tend export .json file."
            return
        }
        guard url.startAccessingSecurityScopedResource() else {
            importError = "Couldn't access that file."
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }
        do {
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode(PersistableData.self, from: data)
            pendingImport = decoded
            showReplaceConfirm = true
        } catch {
            importError = "Make sure it's a Tend export .json file."
        }
    }
}
