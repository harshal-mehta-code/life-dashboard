"use client";

import { useState } from "react";
import { Plus, Phone, MapPin, Sparkles, ListTodo } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { TaskCategory } from "@/lib/types";
import { toast } from "sonner";

const quickCategories: { value: TaskCategory; label: string; icon: typeof Phone }[] = [
  { value: "general", label: "Task", icon: ListTodo },
  { value: "call", label: "Call", icon: Phone },
  { value: "errand", label: "Errand", icon: MapPin },
  { value: "someday", label: "Someday", icon: Sparkles },
];

export function QuickCapture() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("general");
  const addTask = useAppStore((s) => s.addTask);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      category,
      context: category === "call" ? "phone" : category === "errand" ? "out" : "anywhere",
    });
    toast.success("Added", { description: trimmed });
    setTitle("");
    setCategory("general");
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex items-center gap-2"
      >
        <Plus className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick add anything… call the vet, return the package, text Jamie back"
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
        />
        <Button type="submit" size="sm" disabled={!title.trim()}>
          Add
        </Button>
      </form>
      <div className="mt-2.5 flex flex-wrap gap-1.5 pl-1">
        {quickCategories.map((c) => {
          const Icon = c.icon;
          const active = category === c.value;
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-3 w-3" />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
