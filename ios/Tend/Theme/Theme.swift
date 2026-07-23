import SwiftUI

extension Color {
    init(hex: String) {
        var hex = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hex.removeAll { $0 == "#" }
        var value: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&value)
        let r = Double((value & 0xFF0000) >> 16) / 255
        let g = Double((value & 0x00FF00) >> 8) / 255
        let b = Double(value & 0x0000FF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1)
    }

    static func dynamic(light: String, dark: String) -> Color {
        Color(UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(Color(hex: dark)) : UIColor(Color(hex: light))
        })
    }
}

/// Mirrors the CSS custom properties in src/app/globals.css so the iOS app reads as the
/// same product as the web app. Domain accents were unified into one warm palette on the
/// web side (identity now carries on the icon, not the hue) — kept that way here too.
enum Theme {
    static let background = Color.dynamic(light: "FAF7F1", dark: "211C17")
    static let foreground = Color.dynamic(light: "2E2A24", dark: "F3ECE0")
    static let card = Color.dynamic(light: "FFFFFF", dark: "2A2420")
    static let primary = Color.dynamic(light: "B85C3E", dark: "E08A67")
    static let primaryForeground = Color.dynamic(light: "FFFBF6", dark: "241812")
    static let secondary = Color.dynamic(light: "F0E9DD", dark: "362F28")
    static let muted = Color.dynamic(light: "F1EAE0", dark: "362F28")
    static let mutedForeground = Color.dynamic(light: "857D70", dark: "B3A897")
    static let accent = Color.dynamic(light: "EFE6D8", dark: "3D352C")
    static let destructive = Color.dynamic(light: "C1462F", dark: "E17356")
    static let border = Color.dynamic(light: "E7DCC9", dark: "43392E")
    static let brandSoft = Color.dynamic(light: "F5E4D8", dark: "3D2A20")

    // chart accents, reused for small semantic touches (streak growth, birthdays, etc.)
    static let green = Color.dynamic(light: "6E8B6A", dark: "8CAE86")
    static let blue = Color.dynamic(light: "5B7A9D", dark: "86A6C9")
    static let gold = Color.dynamic(light: "C99A3B", dark: "E0B85C")
    static let rose = Color.dynamic(light: "A0637E", dark: "C489A0")

    static let radiusSM: CGFloat = 8
    static let radiusMD: CGFloat = 12
    static let radiusLG: CGFloat = 14
    static let radiusXL: CGFloat = 20
    static let radius2XL: CGFloat = 26
}

extension View {
    /// The rounded "card" container used throughout — one border, one background, one radius.
    func cardSurface(cornerRadius: CGFloat = Theme.radiusXL, fill: Color = Theme.card) -> some View {
        self
            .background(fill)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .strokeBorder(Theme.border, lineWidth: 1)
            )
    }
}
