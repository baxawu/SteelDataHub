import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { SteelTable } from "@/components/steel/steel-table";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: { steel: { include: { standard: true, updatedBy: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const rows = JSON.parse(JSON.stringify(favorites.map((f) => f.steel)));

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">⭐ Favorites</h1>
      <SteelTable
        rows={rows}
        pagination={{ page: 1, pageSize: rows.length || 1, total: rows.length, totalPages: 1 }}
        isAdmin={user.role === "ADMIN"}
      />
    </div>
  );
}
