"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/empty-state";
import { ShoppingBasket, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GroceriesPage() {
  const groceries = useAppStore((s) => s.groceries);
  const addGroceryItem = useAppStore((s) => s.addGroceryItem);
  const toggleGroceryItem = useAppStore((s) => s.toggleGroceryItem);
  const deleteGroceryItem = useAppStore((s) => s.deleteGroceryItem);
  const clearCheckedGroceries = useAppStore((s) => s.clearCheckedGroceries);

  const [name, setName] = useState("");

  const unchecked = useMemo(() => groceries.filter((g) => !g.checked), [groceries]);
  const checked = useMemo(() => groceries.filter((g) => g.checked), [groceries]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addGroceryItem(trimmed);
    setName("");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Groceries"
        subtitle="Your running shopping list. Check things off as you shop, clear when you're done."
      />

      <div className="px-4 pb-8 sm:px-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mb-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm"
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add an item…"
            className="border-0 shadow-none focus-visible:ring-0 h-9"
          />
          <Button type="submit" size="sm" disabled={!name.trim()}>
            Add
          </Button>
        </form>

        {groceries.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Your list is empty"
            description="Add items as you think of them, and pull this up whenever you're at the store."
          />
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              {unchecked.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => toggleGroceryItem(item.id)}
                    className="h-5 w-5 shrink-0 data-[state=checked]:bg-groceries data-[state=checked]:border-groceries"
                  />
                  <p className="flex-1 text-sm font-medium">{item.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteGroceryItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {checked.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    In your cart ({checked.length})
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground"
                    onClick={clearCheckedGroceries}
                  >
                    <X className="h-3 w-3" /> Clear
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {checked.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-3 py-2.5"
                    >
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleGroceryItem(item.id)}
                        className={cn(
                          "h-5 w-5 shrink-0 data-[state=checked]:bg-groceries data-[state=checked]:border-groceries"
                        )}
                      />
                      <p className="flex-1 text-sm text-muted-foreground line-through">
                        {item.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
