import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Mật khẩu mới tối thiểu 8 ký tự"),
});

// POST /api/users/change-password — tự đổi mật khẩu (Section 18, bắt buộc sau lần đăng nhập đầu — Section 39).
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser();

    const rl = rateLimit(`change-pw:${currentUser.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Thử lại quá nhiều lần, vui lòng đợi 1 phút." }, { status: 429 });
    }

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 401 });
    }

    const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });

    await logChange({ userId: user.id, action: "PASSWORD_CHANGE" });

    return NextResponse.json({ message: "Đổi mật khẩu thành công." });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to change password." }, { status: 500 });
  }
}
