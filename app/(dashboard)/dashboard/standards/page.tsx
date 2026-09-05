import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const standards = await prisma.standard.findMany({
    include: { _count: { select: { steelMaterials: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Standards</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {standards.map((s) => (
          <div key={s.id} className="border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">{s.name}</h2>
              <span className="text-xs text-muted-foreground">{s.region}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{s.fullName}</p>
            <Link href={`/dashboard/steel?standard=${s.name}`} className="text-sm text-primary hover:underline">
              Xem {s._count.steelMaterials} loại thép liên quan →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
