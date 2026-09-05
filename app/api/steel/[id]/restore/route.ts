import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";

// POST /api/steel/:id/restore — CHỈ ADMIN (Section 16: Admin có thể khôi phục).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const steel = await prisma.steelMaterial.findUnique({ where: { id: params.id } });
    if (!steel) {
      return NextResponse.json({ error: "Không tìm thấy loại thép." }, { status: 404 });
    }
    if (steel.status !== "ARCHIVED") {
      return NextResponse.json({ error: "Chỉ có thể khôi phục dữ liệu đã Archived." }, { status: 400 });
    }

    const restored = await prisma.steelMaterial.update({
      where: { id: params.id },
      data: { status: "ACTIVE", updatedById: admin.id },
    });

    await logChange({
      userId: admin.id,
      steelId: restored.id,
      action: "RESTORE",
      fieldName: "status",
      oldValue: "ARCHIVED",
      newValue: "ACTIVE",
    });

    return NextResponse.json({ data: restored, message: "Steel material restored successfully." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to restore steel data." }, { status: 500 });
  }
}
