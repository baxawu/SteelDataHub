import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";
import { z } from "zod";

// GET /api/standards (Section 13)
export async function GET() {
  try {
    await requireUser();
    const standards = await prisma.standard.findMany({
      include: { _count: { select: { steelMaterials: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ data: standards });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load standards." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  fullName: z.string().min(1),
  region: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }
    const created = await prisma.standard.create({ data: parsed.data });
    await logChange({ userId: admin.id, action: "CREATE", fieldName: "standard", newValue: created.name });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to create standard." }, { status: 500 });
  }
}
