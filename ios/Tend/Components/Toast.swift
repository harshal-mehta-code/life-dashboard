import SwiftUI

struct ToastAction {
    var label: String
    var handler: () -> Void
}

struct ToastMessage {
    var title: String
    var description: String?
    var style: Style = .success
    var action: ToastAction?
    var secondaryAction: ToastAction?

    enum Style { case success, info }
}

@Observable
final class ToastCenter {
    private(set) var current: ToastMessage?
    private var dismissTask: Task<Void, Never>?

    func show(
        _ title: String,
        description: String? = nil,
        style: ToastMessage.Style = .success,
        action: ToastAction? = nil,
        secondaryAction: ToastAction? = nil
    ) {
        let haptic = UINotificationFeedbackGenerator()
        haptic.notificationOccurred(style == .success ? .success : .warning)

        dismissTask?.cancel()
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            current = ToastMessage(
                title: title,
                description: description,
                style: style,
                action: action,
                secondaryAction: secondaryAction
            )
        }
        dismissTask = Task { @MainActor in
            try? await Task.sleep(for: .seconds(3.6))
            guard !Task.isCancelled else { return }
            withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                current = nil
            }
        }
    }

    func dismiss() {
        dismissTask?.cancel()
        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
            current = nil
        }
    }
}

private struct ToastOverlay: View {
    var message: ToastMessage
    var dismiss: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: message.style == .success ? "checkmark.circle.fill" : "clock.fill")
                    .foregroundStyle(message.style == .success ? Theme.green : Theme.mutedForeground)
                    .font(.system(size: 18))
                VStack(alignment: .leading, spacing: 2) {
                    Text(message.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.foreground)
                    if let description = message.description {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(Theme.mutedForeground)
                    }
                }
                Spacer(minLength: 0)
            }

            if message.action != nil || message.secondaryAction != nil {
                HStack(spacing: 8) {
                    Spacer(minLength: 0)
                    if let secondary = message.secondaryAction {
                        Button(secondary.label) {
                            secondary.handler()
                            dismiss()
                        }
                        .font(.caption.weight(.semibold))
                        .buttonStyle(.bordered)
                        .tint(Theme.mutedForeground)
                        .controlSize(.small)
                    }
                    if let action = message.action {
                        Button(action.label) {
                            action.handler()
                            dismiss()
                        }
                        .font(.caption.weight(.semibold))
                        .buttonStyle(.borderedProminent)
                        .tint(Theme.primary)
                        .controlSize(.small)
                    }
                }
            }
        }
        .padding(14)
        .frame(maxWidth: 420)
        .cardSurface(cornerRadius: Theme.radiusLG)
        .shadow(color: .black.opacity(0.12), radius: 16, y: 6)
        .padding(.horizontal, 16)
    }
}

struct ToastHost: ViewModifier {
    @Environment(ToastCenter.self) private var toastCenter

    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            if let message = toastCenter.current {
                ToastOverlay(message: message, dismiss: { toastCenter.dismiss() })
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .allowsHitTesting(message.action != nil || message.secondaryAction != nil)
            }
        }
    }
}

extension View {
    func toastHost() -> some View { modifier(ToastHost()) }
}
