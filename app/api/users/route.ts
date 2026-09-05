import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { userCreateSchema } from "@/lib/validation/steel";
import { logChange } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// GET /api/users — CHỈ ADMIN (Section 20).
export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load users." }, { status: 500 });
  }
}

// POST /api/users — CHỈ ADMIN tạo user mới.
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const rl = rateLimit(`create-user:${admin.id}`, 20, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });

    const body = await req.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        role: parsed.data.role,
        mustChangePassword: true,
      },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true },
    });

    await logChange({ userId: admin.id, action: "USER_CREATE", fieldName: "email", newValue: user.email });

    return NextResponse.json({ data: user, message: "User created successfully." }, { status: 201 });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to create user." }, { status: 500 });
  }
}
