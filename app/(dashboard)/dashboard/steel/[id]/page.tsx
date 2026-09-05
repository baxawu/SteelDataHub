import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { SteelShapeIllustration } from "@/components/steel/shapes";
import { FavoriteButton } from "@/components/steel/favorite-button";

export const dynamic = "force-dynamic";

// STEEL DETAIL PAGE (Section 9)
export default async function SteelDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [steel, favorite] = await Promise.all([
    prisma.steelMaterial.findUnique({
      where: { id: params.id },
      include: { standard: true, category: true },
    }),
    prisma.favorite.findUnique({
      where: { userId_steelId: { userId: user.id, steelId: params.id } },
    }),
  ]);
  if (!steel) notFound();

  // Ghi Recently Viewed (Section 51): xóa bản ghi cũ (nếu có) rồi tạo mới để cập nhật viewedAt.
  await prisma.recentlyViewed
    .deleteMany({ where: { userId: user.id, steelId: steel.id } })
    .then(() => prisma.recentlyViewed.create({ data: { userId: user.id, steelId: steel.id } }))
    .catch(() => {});

  const isAdmin = user.role === "ADMIN";
  const chem = (steel.chemicalComposition as Record<string, number> | null) || {};

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <Link href="/dashboard/steel" className="text-sm text-muted-foreground hover:underline">
        ← Back to Steel Database
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="border border-border rounded-lg p-6 flex items-center justify-center bg-muted/30 aspect-square">
          <div className="w-56 h-56">
            <SteelShapeIllustration shape={steel.shape} />
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold">{steel.grade}</h1>
              <p className="text-muted-foreground">{steel.name}</p>
            </div>
            <FavoriteButton steelId={steel.id} initialFavorited={!!favorite} />
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge>{steel.standard.name}</Badge>
            <Badge>{steel.materialType}</Badge>
            <Badge>{steel.shape}</Badge>
            <StatusBadge status={steel.status} />
          </div>

          {steel.description && <p className="mt-4 text-sm">{steel.description}</p>}

          <div className="mt-4 flex gap-2">
            <Link href={`/dashboard/compare?ids=${steel.id}`} className="text-sm rounded-md border border-border px-3 py-1.5">
              Compare
            </Link>
            {isAdmin && (
              <Link href={`/dashboard/steel/${steel.id}/edit`} className="text-sm rounded-md bg-primary text-primary-foreground px-3 py-1.5">
                Edit
              </Link>
            )}
          </div>
        </div>
      </div>

      <Section title="Mechanical Properties">
        <PropGrid
          items={[
            ["Yield Strength", steel.yieldStrength ? `${steel.yieldStrength} MPa` : "—"],
            ["Tensile Strength", steel.tensileStrength ? `${steel.tensileStrength} MPa` : "—"],
            ["Elongation", steel.elongation ? `${steel.elongation}%` : "—"],
            ["Density", steel.density ? `${steel.density} kg/m³` : "—"],
            ["Hardness", steel.hardness || "—"],
          ]}
        />
      </Section>

      <Section title="Chemical Composition">
        {Object.keys(chem).length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu thành phần hóa học.</p>
        ) : (
          <PropGrid items={Object.entries(chem).map(([k, v]) => [k, `${v}%`])} />
        )}
      </Section>

      <Section title="Dimensions">
        <PropGrid
          items={[
            ["Thickness", steel.thicknessMin || steel.thicknessMax ? `${steel.thicknessMin ?? "—"} – ${steel.thicknessMax ?? "—"} mm` : "—"],
            ["Width", steel.width ? `${steel.width} mm` : "—"],
            ["Length", steel.length ? `${steel.length} mm` : "—"],
            ["Diameter", steel.diameter ? `${steel.diameter} mm` : "—"],
            ["Weight", steel.weight ? `${steel.weight} kg/m` : "—"],
          ]}
        />
      </Section>

      <Section title="Applicable Standards">
        <p className="text-sm">
          {steel.standard.name} — {steel.standard.fullName} ({steel.standard.region || "—"})
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">{title}</h2>
      {children}
    </div>
  );
}

function PropGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map(([label, value]) => (
        <div key={label} className="border border-border rounded-md p-3">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs rounded-full border border-border px-2 py-0.5">{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700 border-green-200",
    DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
    ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return <span className={`text-xs rounded-full border px-2 py-0.5 ${styles[status] || ""}`}>{status}</span>;
}
