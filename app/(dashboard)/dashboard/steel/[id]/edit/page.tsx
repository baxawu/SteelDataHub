import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { SteelForm } from "@/components/steel/steel-form";

export const dynamic = "force-dynamic";

// EDIT STEEL (Section 15) — chỉ Admin. Field-level change history được ghi ở API PUT.
export default async function EditSteelPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard?error=forbidden");

  const [standards, categories, steel] = await Promise.all([
    prisma.standard.findMany({ orderBy: { name: "asc" } }),
    prisma.steelCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.steelMaterial.findUnique({ where: { id: params.id } }),
  ]);
  if (!steel) notFound();

  const chem = (steel.chemicalComposition as Record<string, number>) || {};

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Edit Steel — {steel.grade}</h1>
      <p className="text-sm text-muted-foreground mb-6">Mọi thay đổi sẽ được ghi vào Change History.</p>
      <SteelForm
        standards={standards}
        categories={categories}
        initial={{
          id: steel.id,
          name: steel.name,
          grade: steel.grade,
          code: steel.code,
          standardId: steel.standardId,
          categoryId: steel.categoryId,
          materialType: steel.materialType,
          shape: steel.shape,
          country: steel.country || "",
          description: steel.description || "",
          yieldStrength: steel.yieldStrength?.toString() ?? "",
          tensileStrength: steel.tensileStrength?.toString() ?? "",
          elongation: steel.elongation?.toString() ?? "",
          density: steel.density?.toString() ?? "",
          hardness: steel.hardness || "",
          chemicalComposition: Object.fromEntries(Object.entries(chem).map(([k, v]) => [k, String(v)])),
          thicknessMin: steel.thicknessMin?.toString() ?? "",
          thicknessMax: steel.thicknessMax?.toString() ?? "",
          width: steel.width?.toString() ?? "",
          length: steel.length?.toString() ?? "",
          diameter: steel.diameter?.toString() ?? "",
          weight: steel.weight?.toString() ?? "",
          imageUrl: steel.imageUrl || "",
          status: steel.status,
        }}
      />
    </div>
  );
}
