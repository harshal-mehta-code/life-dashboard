import SwiftUI

struct RootTabView: View {
    @Environment(TabRouter.self) private var router

    var body: some View {
        @Bindable var router = router
        TabView(selection: $router.selection) {
            NavigationStack { TodayView() }
                .tabItem { Label("Today", systemImage: "sun.max.fill") }
                .tag(AppTab.today)

            NavigationStack { PeopleView() }
                .tabItem { Label("People", systemImage: "person.2.fill") }
                .tag(AppTab.people)

            NavigationStack { ChoresView() }
                .tabItem { Label("Chores", systemImage: "arrow.triangle.2.circlepath") }
                .tag(AppTab.chores)

            NavigationStack { TasksView() }
                .tabItem { Label("Tasks", systemImage: "checklist") }
                .tag(AppTab.tasks)

            NavigationStack { GroceriesView() }
                .tabItem { Label("Groceries", systemImage: "basket.fill") }
                .tag(AppTab.groceries)
        }
    }
}
