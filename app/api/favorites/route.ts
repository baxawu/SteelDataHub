import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";

const bodySchema = z.object({ steelId: z.string().min(1) });

// GET /api/favorites — toàn bộ favorites của user hiện tại (Section 50)
export async function GET() {
  try {
    const user = await requireUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { steel: { include: { standard: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: favorites });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load favorites." }, { status: 500 });
  }
}

// POST /api/favorites { steelId } — thêm vào favorites
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Thiếu steelId." }, { status: 400 });

    await prisma.favorite.upsert({
      where: { userId_steelId: { userId: user.id, steelId: parsed.data.steelId } },
      update: {},
      create: { userId: user.id, steelId: parsed.data.steelId },
    });

    return NextResponse.json({ isFavorite: true });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to add favorite." }, { status: 500 });
  }
}

// DELETE /api/favorites { steelId } — bỏ khỏi favorites
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Thiếu steelId." }, { status: 400 });

    await prisma.favorite
      .delete({ where: { userId_steelId: { userId: user.id, steelId: parsed.data.steelId } } })
      .catch(() => {}); // không sao nếu chưa từng favorite

    return NextResponse.json({ isFavorite: false });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to remove favorite." }, { status: 500 });
  }
}
