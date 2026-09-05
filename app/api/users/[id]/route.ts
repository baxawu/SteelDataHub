import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, permissionErrorResponse, PermissionError } from "@/lib/permissions/permissions";
import { userUpdateSchema } from "@/lib/validation/steel";
import { logChange } from "@/lib/audit";

// PUT /api/users/:id — CHỈ ADMIN. Đổi role/status/name.
// Section 23: "Không để User thay đổi role của chính mình" — chặn admin tự hạ quyền chính mình
// để tránh tự khóa hệ thống (không còn admin nào).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    if (params.id === admin.id && parsed.data.role && parsed.data.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Bạn không thể tự hạ quyền của chính mình." },
        { status: 400 }
      );
    }

    const before = await prisma.user.findUnique({ where: { id: params.id } });
    if (!before) return NextResponse.json({ error: "Không tìm thấy user." }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (parsed.data.role && parsed.data.role !== before.role) {
      await logChange({
        userId: admin.id, action: "ROLE_CHANGE", fieldName: "role",
        oldValue: before.role, newValue: updated.role,
      });
    }

    return NextResponse.json({ data: updated, message: "User updated successfully." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to update user." }, { status: 500 });
  }
}

// DELETE /api/users/:id — CHỈ ADMIN. Không cho tự xóa chính mình.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();

    if (params.id === admin.id) {
      return NextResponse.json({ error: "Bạn không thể tự xóa tài khoản của chính mình." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) return NextResponse.json({ error: "Không tìm thấy user." }, { status: 404 });

    await prisma.user.delete({ where: { id: params.id } });

    await logChange({ userId: admin.id, action: "USER_DELETE", fieldName: "email", oldValue: user.email });

    return NextResponse.json({ message: "User deleted successfully." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to delete user." }, { status: 500 });
  }
}
