import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUser, requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { steelUpdateSchema as updateSchema } from "@/lib/validation/steel";
import { logChange, diffFields } from "@/lib/audit";

// GET /api/steel/:id — mọi user đã đăng nhập đều xem được.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireUser();

    const steel = await prisma.steelMaterial.findUnique({
      where: { id: params.id },
      include: { standard: true, category: true },
    });

    if (!steel) {
      return NextResponse.json({ error: "Không tìm thấy loại thép." }, { status: 404 });
    }

    return NextResponse.json({ data: steel });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to load steel data." }, { status: 500 });
  }
}

// PUT /api/steel/:id — CHỈ ADMIN. User gọi trực tiếp API vẫn nhận 403.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin(); // <-- Backend enforcement, không chỉ ẩn UI

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
    }

    const before = await prisma.steelMaterial.findUnique({ where: { id: params.id } });
    if (!before) {
      return NextResponse.json({ error: "Không tìm thấy loại thép." }, { status: 404 });
    }

    // Section 44: không cho duplicate Steel Grade + Standard nếu đổi 1 trong 2.
    const nextGrade = parsed.data.grade ?? before.grade;
    const nextStandardId = parsed.data.standardId ?? before.standardId;
    if (nextGrade !== before.grade || nextStandardId !== before.standardId) {
      const duplicate = await prisma.steelMaterial.findFirst({
        where: { grade: nextGrade, standardId: nextStandardId, NOT: { id: before.id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Steel Grade "${nextGrade}" đã tồn tại cho Standard này.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.steelMaterial.update({
      where: { id: params.id },
      data: { ...parsed.data, updatedById: admin.id },
    });

    // Ghi change_history cho từng field thay đổi (Section 15/17/45)
    const changes = diffFields(before, parsed.data);
    for (const c of changes) {
      await logChange({
        userId: admin.id,
        steelId: updated.id,
        action: "UPDATE",
        fieldName: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
      });
    }

    return NextResponse.json({ data: updated, message: "Steel material updated successfully." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse; // 401/403
    console.error(error);
    return NextResponse.json({ error: "Unable to update steel data." }, { status: 500 });
  }
}

// DELETE /api/steel/:id — CHỈ ADMIN. Soft delete (Section 16): set status = ARCHIVED.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const url = new URL(req.url);
    const hardDelete = url.searchParams.get("hard") === "true";

    if (hardDelete) {
      // Xóa vĩnh viễn yêu cầu xác nhận rõ ràng từ client (confirm dialog ở FE)
      // và ở đây double-check header xác nhận để tránh gọi nhầm.
      const confirmHeader = req.headers.get("x-confirm-permanent-delete");
      if (confirmHeader !== "true") {
        return NextResponse.json(
          { error: "Yêu cầu xác nhận để xóa vĩnh viễn." },
          { status: 400 }
        );
      }
      await prisma.steelMaterial.delete({ where: { id: params.id } });
      await prisma.changeHistory.create({
        data: { userId: admin.id, action: "DELETE", fieldName: "steel_id", oldValue: params.id },
      });
      return NextResponse.json({ message: "Steel material permanently deleted." });
    }

    const archived = await prisma.steelMaterial.update({
      where: { id: params.id },
      data: { status: "ARCHIVED", updatedById: admin.id },
    });

    await prisma.changeHistory.create({
      data: {
        userId: admin.id,
        steelId: archived.id,
        action: "DELETE",
        fieldName: "status",
        newValue: "ARCHIVED",
      },
    });

    return NextResponse.json({ data: archived, message: "Steel material archived successfully." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to delete steel data." }, { status: 500 });
  }
}
