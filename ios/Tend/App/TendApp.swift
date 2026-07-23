import SwiftUI

@main
struct TendApp: App {
    @State private var store = AppStore()
    @State private var toastCenter = ToastCenter()
    @State private var router = TabRouter()

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .toastHost()
                .environment(store)
                .environment(toastCenter)
                .environment(router)
                .tint(Theme.primary)
        }
    }
}
