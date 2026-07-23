import Foundation

enum AppTab: Hashable {
    case today, people, chores, tasks, groceries
}

/// Lets a control in one tab (e.g. a toast's "View" action) switch tabs and hand off a
/// pending filter, mirroring the web app's `router.push("/tasks?filter=errand")`.
@Observable
final class TabRouter {
    var selection: AppTab = .today
    var pendingTaskFilter: TaskCategory?
}
