import Foundation

/// Date math ported 1:1 from the web app's `src/lib/date-utils.ts` (which uses date-fns).
///
/// Two conventions carried over from the TypeScript source:
///  - Dates are stored as `String` (full ISO-8601 datetimes, `yyyy-MM-dd`, or `MM-DD`),
///    parsed to `Date` only for calculation, matching date-fns / `Date.toISOString()`.
///  - All "days since / until" math is **calendar-day difference in the local calendar**
///    (mirroring date-fns `differenceInCalendarDays`), never raw 24h-interval math.
enum DateUtils {
    // MARK: - Formatters

    /// ISO8601 with fractional seconds, e.g. "2026-07-21T12:34:56.789Z" (matches JS `toISOString()`).
    private static let isoWithFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    /// ISO8601 without fractional seconds, e.g. "2026-07-21T12:34:56Z".
    private static let isoNoFraction: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    /// "yyyy-MM-dd" in the local calendar/timezone — used for date-only fields.
    private static let dateOnlyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.calendar = Calendar.current
        f.timeZone = Calendar.current.timeZone
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    // MARK: - Parsing

    /// Replicates date-fns `parseISO`: accepts both full ISO datetimes and plain "yyyy-MM-dd".
    /// Date-only strings are interpreted as **local midnight** (not UTC), via `Calendar.current`.
    /// Returns nil only if the string matches none of the accepted shapes.
    static func parseFlexible(_ s: String) -> Date? {
        if let d = isoWithFraction.date(from: s) { return d }
        if let d = isoNoFraction.date(from: s) { return d }
        if let d = dateOnlyFormatter.date(from: s) { return d }
        return nil
    }

    /// Non-crashing parse for live user data: falls back to "now" if the string is unparseable,
    /// so day-diff math degrades to 0 rather than force-unwrapping.
    private static func parseOrNow(_ s: String) -> Date {
        parseFlexible(s) ?? Date()
    }

    /// Calendar-day difference `left - right` in the local calendar (date-fns `differenceInCalendarDays`).
    private static func calendarDayDiff(_ left: Date, _ right: Date) -> Int {
        let cal = Calendar.current
        let l = cal.startOfDay(for: left)
        let r = cal.startOfDay(for: right)
        return cal.dateComponents([.day], from: r, to: l).day ?? 0
    }

    // MARK: - Core

    static func nowISO() -> String {
        isoWithFraction.string(from: Date())
    }

    static func todayDateISO() -> String {
        dateOnlyFormatter.string(from: Date())
    }

    /// Formats an arbitrary `Date` as "yyyy-MM-dd" in the local calendar — used when a SwiftUI
    /// `DatePicker` (which works in `Date`) needs to be written back into a date-only string field.
    static func dateOnlyString(from date: Date) -> String {
        dateOnlyFormatter.string(from: date)
    }

    static func addDaysISO(_ dateISO: String, _ days: Int) -> String {
        let base = parseOrNow(dateISO)
        let shifted = Calendar.current.date(byAdding: .day, value: days, to: base) ?? base
        return dateOnlyFormatter.string(from: shifted)
    }

    static func daysSince(_ dateISO: String) -> Int {
        calendarDayDiff(Date(), parseOrNow(dateISO))
    }

    static func isPastOrToday(_ dateISO: String) -> Bool {
        calendarDayDiff(parseOrNow(dateISO), Date()) <= 0
    }

    static func isToday(_ dateISO: String) -> Bool {
        guard let d = parseFlexible(dateISO) else { return false }
        return Calendar.current.isDateInToday(d)
    }

    // MARK: - Labels

    /// Human relative label for a due/anchor date, e.g. "3 days overdue", "today", "in 5 days".
    static func relativeDueLabel(_ dateISO: String) -> String {
        let diff = calendarDayDiff(parseOrNow(dateISO), Date())
        if diff == 0 { return "today" }
        if diff == 1 { return "tomorrow" }
        if diff > 1 { return "in \(diff) days" }
        if diff == -1 { return "yesterday" }
        return "\(abs(diff)) days overdue"
    }

    /// For relationship cadence: "3 days ago", "today", "2 weeks ago".
    static func relativeSinceLabel(_ dateISO: String?) -> String {
        guard let dateISO else { return "never" }
        let d = daysSince(dateISO)
        if d <= 0 { return "today" }
        if d == 1 { return "yesterday" }
        if d < 14 { return "\(d) days ago" }
        if d < 60 { return "\(Int((Double(d) / 7).rounded())) weeks ago" }
        return "\(Int((Double(d) / 30).rounded())) months ago"
    }

    /// Calm, guilt-free phrasing for a due/anchor date — used on the Today view instead of "N days overdue".
    static func gentleDueLabel(_ dateISO: String) -> String {
        let diff = calendarDayDiff(parseOrNow(dateISO), Date())
        if diff == 0 { return "today" }
        if diff == 1 { return "tomorrow" }
        if diff > 1 { return "in \(diff) days" }
        return "when you can"
    }

    // MARK: - Annual (birthday) dates

    /// Days from today until the next occurrence of an annual "MM-DD" date (birthdays, etc). 0 = today.
    /// Returns nil for malformed input.
    static func daysUntilAnnual(_ mmdd: String) -> Int? {
        let parts = mmdd.split(separator: "-", omittingEmptySubsequences: false)
        guard parts.count == 2,
              parts[0].count == 2, parts[1].count == 2,
              let mm = Int(parts[0]), let dd = Int(parts[1]),
              parts[0].allSatisfy(\.isNumber), parts[1].allSatisfy(\.isNumber)
        else { return nil }

        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        let year = cal.component(.year, from: today)

        guard let thisYear = cal.date(from: DateComponents(year: year, month: mm, day: dd)) else {
            return nil
        }
        var next = cal.startOfDay(for: thisYear)
        if next < today {
            guard let nextYear = cal.date(from: DateComponents(year: year + 1, month: mm, day: dd)) else {
                return nil
            }
            next = cal.startOfDay(for: nextYear)
        }
        return calendarDayDiff(next, today)
    }

    private static let annualDisplayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.setLocalizedDateFormatFromTemplate("MMMd")
        return f
    }()

    /// "Jun 15" from an "MM-DD" string, for display.
    static func formatAnnualDate(_ mmdd: String) -> String {
        let parts = mmdd.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 2 else { return mmdd }
        let cal = Calendar.current
        guard let date = cal.date(from: DateComponents(year: 2000, month: parts[0], day: parts[1])) else {
            return mmdd
        }
        return annualDisplayFormatter.string(from: date)
    }

    /// The coming Saturday — today itself if today is already Sat/Sun. Used by the "This weekend" reschedule preset.
    static func thisWeekendISO() -> String {
        let weekday = Calendar.current.component(.weekday, from: Date()) // 1 = Sun, 7 = Sat
        if weekday == 1 || weekday == 7 { return todayDateISO() }
        let daysUntilSaturday = 7 - weekday
        return addDaysISO(todayDateISO(), daysUntilSaturday)
    }

    static func formatCadence(_ days: Int) -> String {
        switch days {
        case 1: return "daily"
        case 7: return "weekly"
        case 14: return "every 2 weeks"
        case 30: return "monthly"
        case 90: return "every 3 months"
        default:
            if days % 7 == 0 { return "every \(days / 7) weeks" }
            return "every \(days) days"
        }
    }
}
