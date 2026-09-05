"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Eye, Pencil, Archive, RotateCcw, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { SteelShapeIllustration } from "./shapes";

type SteelRow = {
  id: string;
  name: string;
  grade: string;
  code: string;
  shape: string;
  materialType: string;
  country: string | null;
  yieldStrength: number | null;
  tensileStrength: number | null;
  thicknessMin: number | null;
  thicknessMax: number | null;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  updatedAt: string;
  standard: { name: string };
  updatedBy: { name: string } | null;
};

// Section 6/48: bảng dữ liệu chuyên nghiệp, actions theo quyền, pagination.
export function SteelTable({
  rows,
  pagination,
  isAdmin,
  selectable,
  selectedIds,
  onToggleSelect,
}: {
  rows: SteelRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  isAdmin: boolean;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  async function handleArchive(id: string) {
    setBusyId(id);
    await fetch(`/api/steel/${id}`, { method: "DELETE" });
    setBusyId(null);
    router.refresh();
  }

  async function handleRestore(id: string) {
    setBusyId(id);
    await fetch(`/api/steel/${id}/restore`, { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-12 text-center text-sm text-muted-foreground">
        <p className="mb-3">No steel materials found.</p>
        <div className="flex gap-2 justify-center">
          <Link href={pathname} className="underline">Clear Filters</Link>
          {isAdmin && <Link href="/dashboard/steel/add" className="underline">Add Steel</Link>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {selectable && <th className="p-3 w-8"></th>}
              <th className="p-3 text-left w-16">Image</th>
              <th className="p-3 text-left">Steel Name / Grade</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Standard</th>
              <th className="p-3 text-left">Shape</th>
              <th className="p-3 text-left">Yield / Tensile</th>
              <th className="p-3 text-left">Thickness</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Updated</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                {selectable && (
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(s.id) ?? false}
                      onChange={() => onToggleSelect?.(s.id)}
                    />
                  </td>
                )}
                <td className="p-3">
                  <div className="w-10 h-10"><SteelShapeIllustration shape={s.shape} /></div>
                </td>
                <td className="p-3">
                  <Link href={`/dashboard/steel/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                  <div className="text-xs text-muted-foreground">{s.grade}</div>
                </td>
                <td className="p-3 font-mono text-xs">{s.code}</td>
                <td className="p-3"><Badge>{s.standard.name}</Badge></td>
                <td className="p-3">{s.shape}</td>
                <td className="p-3 text-xs">
                  {s.yieldStrength ? `${s.yieldStrength} MPa` : "—"} / {s.tensileStrength ? `${s.tensileStrength} MPa` : "—"}
                </td>
                <td className="p-3 text-xs">
                  {s.thicknessMin || s.thicknessMax ? `${s.thicknessMin ?? "?"}–${s.thicknessMax ?? "?"} mm` : "—"}
                </td>
                <td className="p-3"><StatusBadge status={s.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">
                  {new Date(s.updatedAt).toLocaleDateString("vi-VN")}
                  {s.updatedBy ? <div>{s.updatedBy.name}</div> : null}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/steel/${s.id}`} className="p-1.5 rounded hover:bg-muted" title="View">
                      <Eye size={15} />
                    </Link>
                    {isAdmin && (
                      <Link href={`/dashboard/steel/${s.id}/edit`} className="p-1.5 rounded hover:bg-muted" title="Edit">
                        <Pencil size={15} />
                      </Link>
                    )}
                    {isAdmin && s.status !== "ARCHIVED" && (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => handleArchive(s.id)}
                        className="p-1.5 rounded hover:bg-muted text-red-600"
                        title="Archive (soft delete)"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                    {isAdmin && s.status === "ARCHIVED" && (
                      <button
                        disabled={busyId === s.id}
                        onClick={() => handleRestore(s.id)}
                        className="p-1.5 rounded hover:bg-muted text-green-600"
                        title="Restore"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Hiển thị {(pagination.page - 1) * pagination.pageSize + 1}–
          {Math.min(pagination.page * pagination.pageSize, pagination.total)} / {pagination.total} bản ghi
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={pagination.page <= 1 || isPending}
            onClick={() => goToPage(pagination.page - 1)}
            className="px-3 py-1 rounded border border-border disabled:opacity-40"
          >
            Previous
          </button>
          <span>Trang {pagination.page} / {pagination.totalPages || 1}</span>
          <button
            disabled={pagination.page >= pagination.totalPages || isPending}
            onClick={() => goToPage(pagination.page + 1)}
            className="px-3 py-1 rounded border border-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-xs font-medium">{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
    ARCHIVED: "bg-gray-200 text-gray-600",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>;
}
