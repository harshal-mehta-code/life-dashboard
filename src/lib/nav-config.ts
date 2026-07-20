import { LayoutDashboard, ListChecks, Repeat, ShoppingBasket, Users } from "lucide-react";

export const navItems = [
  { href: "/", label: "Today", icon: LayoutDashboard, accent: "primary" as const },
  { href: "/people", label: "People", icon: Users, accent: "people" as const },
  { href: "/chores", label: "Chores", icon: Repeat, accent: "chores" as const },
  { href: "/tasks", label: "Tasks", icon: ListChecks, accent: "tasks" as const },
  { href: "/groceries", label: "Groceries", icon: ShoppingBasket, accent: "groceries" as const },
];
