import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "added", UPDATE: "updated", DELETE: "archived", RESTORE: "restored",
  IMPORT: "imported data", EXPORT: "exported data", LOGIN: "logged in", LOGOUT: "logged out",
  ROLE_CHANGE: "changed role of", USER_CREATE: "created user", USER_DELETE: "removed user",
  PASSWORD_CHANGE: "changed password",
};

// DASHBOARD (Section 5, 28, 49) — Admin và User thấy nội dung khác nhau.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "ADMIN";

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalSteel, totalStandards, totalCategories, addedThisMonth, updatedThisMonth,
    totalUsers, recentlyAdded, recentlyUpdated, activity, byStandardRaw, byCategoryRaw,
    myFavorites, myRecentlyViewed,
  ] = await Promise.all([
    prisma.steelMaterial.count({ where: { status: { not: "ARCHIVED" } } }),
    prisma.standard.count(),
    prisma.steelCategory.count(),
    prisma.changeHistory.count({ where: { action: "CREATE", createdAt: { gte: monthAgo } } }),
    prisma.changeHistory.count({ where: { action: "UPDATE", createdAt: { gte: monthAgo } } }),
    isAdmin ? prisma.user.count() : Promise.resolve(null),
    prisma.steelMaterial.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { standard: true },
    }),
    prisma.steelMaterial.findMany({
      where: { status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { standard: true, updatedBy: { select: { name: true } } },
    }),
    prisma.changeHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true, role: true } }, steel: { select: { name: true, grade: true } } },
    }),
    prisma.steelMaterial.groupBy({ by: ["standardId"], _count: { _all: true }, where: { status: { not: "ARCHIVED" } } }),
    prisma.steelMaterial.groupBy({ by: ["categoryId"], _count: { _all: true }, where: { status: { not: "ARCHIVED" } } }),
    !isAdmin
      ? prisma.favorite.findMany({ where: { userId: user.id }, take: 5, orderBy: { createdAt: "desc" }, include: { steel: true } })
      : Promise.resolve([]),
    !isAdmin
      ? prisma.recentlyViewed.findMany({ where: { userId: user.id }, take: 5, orderBy: { viewedAt: "desc" }, include: { steel: true } })
      : Promise.resolve([]),
  ]);

  const [standards, categories] = await Promise.all([
    prisma.standard.findMany(),
    prisma.steelCategory.findMany(),
  ]);
  const byStandard = byStandardRaw.map((g) => ({
    name: standards.find((s) => s.id === g.standardId)?.name || "—",
    value: g._count._all,
  }));
  const byCategory = byCategoryRaw.map((g) => ({
    name: categories.find((c) => c.id === g.categoryId)?.name || "—",
    value: g._count._all,
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Xin chào, {user.name} ({isAdmin ? "Admin" : "User"})
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="TOTAL STEEL" value={totalSteel} />
        <StatCard label="STANDARDS" value={totalStandards} />
        <StatCard label="ADDED THIS MONTH" value={addedThisMonth} />
        <StatCard label="UPDATED THIS MONTH" value={updatedThisMonth} />
        {isAdmin && <StatCard label="USERS" value={totalUsers || 0} />}
        {isAdmin && <StatCard label="CATEGORIES" value={totalCategories} />}
      </div>

      <div className="mb-6">
        <AnalyticsCharts byStandard={byStandard} byCategory={byCategory} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Panel title="Recently Added">
          {recentlyAdded.length === 0 && <Empty />}
          {recentlyAdded.map((s) => (
            <Link key={s.id} href={`/dashboard/steel/${s.id}`} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 hover:bg-muted/50 px-1 rounded">
              <span className="text-sm">{s.grade} <span className="text-muted-foreground">· {s.name}</span></span>
              <span className="text-xs text-muted-foreground">{s.standard.name}</span>
            </Link>
          ))}
        </Panel>

        <Panel title="Recently Updated">
          {recentlyUpdated.length === 0 && <Empty />}
          {recentlyUpdated.map((s) => (
            <Link key={s.id} href={`/dashboard/steel/${s.id}`} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 hover:bg-muted/50 px-1 rounded">
              <span className="text-sm">{s.grade} <span className="text-muted-foreground">· {s.name}</span></span>
              <span className="text-xs text-muted-foreground">{s.updatedBy?.name || "—"}</span>
            </Link>
          ))}
        </Panel>
      </div>

      {isAdmin ? (
        <Panel title="Activity Timeline">
          {activity.length === 0 && <Empty />}
          {activity.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0 text-sm">
              <span>
                <span className="font-medium">{a.user?.name || "System"}</span>{" "}
                <span className="text-muted-foreground">{ACTION_LABELS[a.action] || a.action.toLowerCase()}</span>{" "}
                {a.steel && <span className="font-medium">{a.steel.grade}</span>}
              </span>
              <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("vi-VN")}</span>
            </div>
          ))}
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Your Favorites">
            {myFavorites.length === 0 && <Empty />}
            {myFavorites.map((f) => (
              <Link key={f.id} href={`/dashboard/steel/${f.steelId}`} className="block py-2 border-b border-border last:border-b-0 text-sm hover:bg-muted/50 px-1 rounded">
                {f.steel.grade} <span className="text-muted-foreground">· {f.steel.name}</span>
              </Link>
            ))}
          </Panel>
          <Panel title="Recently Viewed">
            {myRecentlyViewed.length === 0 && <Empty />}
            {myRecentlyViewed.map((v) => (
              <Link key={v.id} href={`/dashboard/steel/${v.steelId}`} className="block py-2 border-b border-border last:border-b-0 text-sm hover:bg-muted/50 px-1 rounded">
                {v.steel.grade} <span className="text-muted-foreground">· {v.steel.name}</span>
              </Link>
            ))}
          </Panel>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-xs font-medium text-muted-foreground tracking-wide">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value.toLocaleString("vi-VN")}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-sm font-medium mb-2">{title}</p>
      <div>{children}</div>
    </div>
  );
}

function Empty() {
  return <p className="text-sm text-muted-foreground py-4 text-center">Chưa có dữ liệu.</p>;
}
