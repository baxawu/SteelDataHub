import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";
import { z } from "zod";

// GET /api/categories — danh sách category kèm số lượng thép (Section 12)
export async function GET() {
  try {
    await requireUser();
    const categories = await prisma.steelCategory.findMany({
      include: { _count: { select: { steelMaterials: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: categories });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load categories." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
});

// POST /api/categories — chỉ Admin
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }
    const created = await prisma.steelCategory.create({ data: parsed.data });
    await logChange({ userId: admin.id, action: "CREATE", fieldName: "category", newValue: created.name });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to create category." }, { status: 500 });
  }
}
