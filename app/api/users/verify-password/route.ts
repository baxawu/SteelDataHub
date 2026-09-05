import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({ password: z.string().min(1) });

// POST /api/users/verify-password — Section 20: yêu cầu Admin xác thực lại
// mật khẩu trước khi vào trang User Management.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Chống brute-force: tối đa 5 lần thử / phút / user.
    const rl = rateLimit(`verify-pw:${admin.id}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Thử lại quá nhiều lần, vui lòng đợi 1 phút." }, { status: 429 });
    }

    const { password } = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { id: admin.id } });
    if (!user) return NextResponse.json({ ok: false }, { status: 404 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    return NextResponse.json({ ok: valid }, { status: valid ? 200 : 401 });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
