import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const categories = await prisma.steelCategory.findMany({
    include: { _count: { select: { steelMaterials: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">Steel Categories</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/steel?category=${c.slug}`}
            className="border border-border rounded-lg p-5 hover:shadow-sm hover:border-primary/40 transition-colors"
          >
            <h2 className="font-medium mb-1">{c.name}</h2>
            <p className="text-sm text-muted-foreground">{c._count.steelMaterials} loại thép</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
