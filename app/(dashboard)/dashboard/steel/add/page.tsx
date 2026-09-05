import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { SteelForm } from "@/components/steel/steel-form";

export const dynamic = "force-dynamic";

// ADD STEEL (Section 14) — chỉ Admin (chặn cả server component lẫn API PUT/POST).
export default async function AddSteelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard?error=forbidden");

  const [standards, categories] = await Promise.all([
    prisma.standard.findMany({ orderBy: { name: "asc" } }),
    prisma.steelCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Add Steel</h1>
      <p className="text-sm text-muted-foreground mb-6">Thêm mới một loại thép vào database.</p>
      <SteelForm standards={standards} categories={categories} />
    </div>
  );
}
