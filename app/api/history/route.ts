import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";

// GET /api/history — mọi user đã đăng nhập xem được (view-only), filter theo Section 17.
export async function GET(req: NextRequest) {
  try {
    await requireUser();
    const sp = req.nextUrl.searchParams;
    const action = sp.get("action") || undefined;
    const userId = sp.get("userId") || undefined;
    const steelId = sp.get("steelId") || undefined;
    const dateFrom = sp.get("dateFrom") || undefined;
    const dateTo = sp.get("dateTo") || undefined;
    const page = Math.max(1, Number(sp.get("page") ?? 1));
    const pageSize = 25;

    const where: Prisma.ChangeHistoryWhereInput = {
      ...(action ? { action: action as any } : {}),
      ...(userId ? { userId } : {}),
      ...(steelId ? { steelId } : {}),
      ...(dateFrom || dateTo
        ? { createdAt: { gte: dateFrom ? new Date(dateFrom) : undefined, lte: dateTo ? new Date(dateTo) : undefined } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.changeHistory.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, steel: { select: { name: true, grade: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.changeHistory.count({ where }),
    ]);

    return NextResponse.json({ data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 } });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to load change history." }, { status: 500 });
  }
}
