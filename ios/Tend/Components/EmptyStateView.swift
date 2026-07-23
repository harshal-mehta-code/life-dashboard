import SwiftUI

struct EmptyStateView: View {
    var systemImage: String
    var title: String
    var description: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 30, weight: .medium))
                .foregroundStyle(Theme.primary)
                .padding(16)
                .background(Circle().fill(Theme.brandSoft))
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.foreground)
            Text(description)
                .font(.subheadline)
                .foregroundStyle(Theme.mutedForeground)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 36)
        .padding(.horizontal, 24)
    }
}
