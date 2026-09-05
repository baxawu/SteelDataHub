import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";

// GET /api/steel/search?q=S355 — autocomplete nhẹ cho search box (Section 7/29).
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 1) return NextResponse.json({ data: [] });

    const results = await prisma.steelMaterial.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { grade: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
          { shape: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, grade: true, shape: true, materialType: true, standard: { select: { name: true } } },
      take: 8,
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
