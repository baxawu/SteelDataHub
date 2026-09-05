import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { HistoryFilters } from "@/components/history/history-filters";

export const dynamic = "force-dynamic";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  RESTORE: "bg-purple-100 text-purple-800",
  IMPORT: "bg-indigo-100 text-indigo-800",
  EXPORT: "bg-indigo-100 text-indigo-800",
  LOGIN: "bg-gray-100 text-gray-700",
  LOGOUT: "bg-gray-100 text-gray-700",
  ROLE_CHANGE: "bg-amber-100 text-amber-800",
  USER_CREATE: "bg-green-100 text-green-800",
  USER_DELETE: "bg-red-100 text-red-800",
  PASSWORD_CHANGE: "bg-amber-100 text-amber-800",
};

export default async function HistoryPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const where: any = {
    ...(searchParams.action ? { action: searchParams.action } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.changeHistory.findMany({
      where,
      include: { user: { select: { name: true } }, steel: { select: { name: true, grade: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * 25,
      take: 25,
    }),
    prisma.changeHistory.count({ where }),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-1">Change History</h1>
      <p className="text-sm text-muted-foreground mb-6">{total.toLocaleString("vi-VN")} bản ghi audit log</p>

      <HistoryFilters />

      <div className="overflow-x-auto border border-border rounded-lg mt-4">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">User</th>
              <th className="p-3 text-left">Action</th>
              <th className="p-3 text-left">Steel</th>
              <th className="p-3 text-left">Field</th>
              <th className="p-3 text-left">Old → New</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-t border-border">
                <td className="p-3 text-xs whitespace-nowrap">{new Date(h.createdAt).toLocaleString("vi-VN")}</td>
                <td className="p-3">{h.user?.name ?? "System"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[h.action] ?? "bg-muted"}`}>
                    {h.action}
                  </span>
                </td>
                <td className="p-3">{h.steel ? `${h.steel.name} (${h.steel.grade})` : "—"}</td>
                <td className="p-3 text-xs">{h.fieldName ?? "—"}</td>
                <td className="p-3 text-xs">
                  {h.oldValue || h.newValue ? (
                    <span>
                      <span className="text-muted-foreground">{h.oldValue || "—"}</span> → <span className="font-medium">{h.newValue || "—"}</span>
                    </span>
                  ) : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Chưa có dữ liệu lịch sử.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
