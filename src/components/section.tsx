import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export function Section({
  title,
  icon: Icon,
  accent,
  count,
  description,
  action,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent: "people" | "chores" | "tasks" | "groceries" | "primary";
  count?: number;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              backgroundColor: `var(--${accent}-soft, var(--muted))`,
              color: `var(--${accent})`,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="font-heading text-base font-semibold">{title}</h2>
          {typeof count === "number" && count > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `var(--${accent}-soft, var(--muted))`,
                color: `var(--${accent})`,
              }}
            >
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      {description && (
        <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="space-y-2">{children}</div>
    </section>
  );
}
