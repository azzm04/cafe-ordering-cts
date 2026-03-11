"use client";

import type { Category } from "@/types/";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: Category[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Tabs value={value} onValueChange={onChange}>
      <TabsList className="w-full">
        {categories.map((c) => (
          <TabsTrigger key={c.id} value={c.id} className="flex-1">
            {c.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
