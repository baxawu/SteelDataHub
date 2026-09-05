"use client";

import { useState } from "react";
import Link from "next/link";
import { SteelTable } from "./steel-table";

// Bọc SteelTable, thêm checkbox chọn 2-4 loại thép để Compare (Section 11).
export function SteelBrowser({
  rows, pagination, isAdmin,
}: {
  rows: any[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  isAdmin: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {selected.size >= 2 && (
        <div className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-4 py-2">
          <p className="text-sm">Đã chọn {selected.size} loại thép để so sánh</p>
          <Link
            href={`/dashboard/compare?ids=${Array.from(selected).join(",")}`}
            className="rounded-md bg-primary text-primary-foreground text-sm px-3 py-1.5"
          >
            Compare Selected
          </Link>
        </div>
      )}
      <SteelTable
        rows={rows}
        pagination={pagination}
        isAdmin={isAdmin}
        selectable
        selectedIds={selected}
        onToggleSelect={toggle}
      />
    </div>
  );
}
