import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { SteelFilters } from "@/components/steel/steel-filters";
import { SteelBrowser } from "@/components/steel/steel-browser";

export const dynamic = "force-dynamic";

// STEEL DATABASE (Section 6/7/8/47/48) — server component: fetch trực tiếp qua Prisma
// theo searchParams (URL là nguồn sự thật cho filter/search/pagination, Section 46).
export default async function SteelDatabasePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const isAdmin = user.role === "ADMIN";

  const {
    q, standard, category, shape, country, status,
    thicknessMin, thicknessMax, yieldMin, yieldMax,
  } = searchParams;

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const pageSize = 25;

  const where: Prisma.SteelMaterialWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { grade: { contains: q, mode: "insensitive" } },
              { code: { contains: q, mode: "insensitive" } },
              { materialType: { contains: q, mode: "insensitive" } },
              { shape: { contains: q, mode: "insensitive" } },
              { standard: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
      standard ? { standard: { name: standard } } : {},
      category ? { category: { slug: category } } : {},
      shape ? { shape: { equals: shape, mode: "insensitive" } } : {},
      country ? { country: { equals: country, mode: "insensitive" } } : {},
      status && status !== "ALL" ? { status: status as any } : !status ? { status: { not: "ARCHIVED" } } : {},
      thicknessMin ? { thicknessMax: { gte: parseFloat(thicknessMin) } } : {},
      thicknessMax ? { thicknessMin: { lte: parseFloat(thicknessMax) } } : {},
      yieldMin ? { yieldStrength: { gte: parseFloat(yieldMin) } } : {},
      yieldMax ? { yieldStrength: { lte: parseFloat(yieldMax) } } : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.steelMaterial.count({ where }),
    prisma.steelMaterial.findMany({
      where,
      include: { standard: true, updatedBy: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const pagination = { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Steel Database</h1>
          <p className="text-sm text-muted-foreground">{total.toLocaleString("vi-VN")} loại thép</p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/steel/add" className="rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 whitespace-nowrap w-fit">
            + Add Steel
          </Link>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <SteelFilters />
        <div className="flex-1 min-w-0">
          <SteelBrowser
            rows={JSON.parse(JSON.stringify(items))}
            pagination={pagination}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
