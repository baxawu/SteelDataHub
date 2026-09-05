import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";

// GET /api/steel/compare?ids=id1,id2,id3 — Compare 2-4 loại thép (Section 11)
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const idsParam = req.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ error: "Thiếu tham số ids." }, { status: 400 });
    }
    const ids = idsParam.split(",").filter(Boolean).slice(0, 4);
    if (ids.length < 2) {
      return NextResponse.json({ error: "Cần chọn ít nhất 2 loại thép để so sánh." }, { status: 400 });
    }

    const items = await prisma.steelMaterial.findMany({
      where: { id: { in: ids } },
      include: { standard: true, category: true },
    });

    // Giữ đúng thứ tự theo ids truyền vào
    const ordered = ids.map((id) => items.find((i) => i.id === id)).filter(Boolean);

    return NextResponse.json({ data: ordered });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load comparison data." }, { status: 500 });
  }
}
