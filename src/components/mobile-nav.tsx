"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
          >
            <Icon
              className={cn("h-5 w-5", !isActive && "text-muted-foreground")}
              style={isActive ? { color: `var(--${item.accent})` } : undefined}
            />
            <span className={cn(!isActive && "text-muted-foreground")} style={isActive ? { color: `var(--${item.accent})` } : undefined}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
