import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";
import { steelCreateSchema } from "@/lib/validation/steel";
import { logChange } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";

// ============ GET /api/steel — Search + Filter + Pagination (Section 7,8,47,48) ============
export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const standard = sp.get("standard");
    const category = sp.get("category");
    const shape = sp.get("shape");
    const country = sp.get("country");
    const status = sp.get("status");
    const thicknessMin = sp.get("thicknessMin");
    const thicknessMax = sp.get("thicknessMax");
    const yieldMin = sp.get("yieldMin");
    const yieldMax = sp.get("yieldMax");
    const tensileMin = sp.get("tensileMin");
    const tensileMax = sp.get("tensileMax");

    const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(10, parseInt(sp.get("pageSize") || "25", 10)));
    const sortBy = sp.get("sortBy") || "updatedAt";
    const sortDir = sp.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Prisma.SteelMaterialWhereInput = {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { grade: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
                { materialType: { contains: q, mode: "insensitive" } },
                { shape: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { standard: { name: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {},
        standard ? { standard: { name: standard } } : {},
        category ? { category: { slug: category } } : {},
        shape ? { shape: { equals: shape, mode: "insensitive" } } : {},
        country ? { country: { equals: country, mode: "insensitive" } } : {},
        status && status !== "ALL" ? { status: status as any } : status === "ALL" ? {} : { status: { not: "ARCHIVED" } },
        thicknessMin ? { thicknessMax: { gte: parseFloat(thicknessMin) } } : {},
        thicknessMax ? { thicknessMin: { lte: parseFloat(thicknessMax) } } : {},
        yieldMin ? { yieldStrength: { gte: parseFloat(yieldMin) } } : {},
        yieldMax ? { yieldStrength: { lte: parseFloat(yieldMax) } } : {},
        tensileMin ? { tensileStrength: { gte: parseFloat(tensileMin) } } : {},
        tensileMax ? { tensileStrength: { lte: parseFloat(tensileMax) } } : {},
      ],
    };

    const [total, items] = await Promise.all([
      prisma.steelMaterial.count({ where }),
      prisma.steelMaterial.findMany({
        where,
        include: { standard: true, category: true, updatedBy: { select: { name: true } } },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
    });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to load steel data." }, { status: 500 });
  }
}

// ============ POST /api/steel — Add Steel (Section 14), CHỈ ADMIN ============
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();

    const rl = rateLimit(`create-steel:${admin.id}`, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Quá nhiều yêu cầu, thử lại sau." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = steelCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Chống duplicate Steel Grade + Standard (Section 44)
    const existing = await prisma.steelMaterial.findUnique({
      where: {
        uniq_grade_standard: {
          grade: parsed.data.grade,
          standardId: parsed.data.standardId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Grade "${parsed.data.grade}" đã tồn tại cho Standard này.` },
        { status: 409 }
      );
    }

    const created = await prisma.steelMaterial.create({
      data: { ...parsed.data, createdById: admin.id, updatedById: admin.id },
    });

    await logChange({
      userId: admin.id,
      steelId: created.id,
      action: "CREATE",
      newValue: created.name,
    });

    return NextResponse.json(
      { data: created, message: "Steel material added successfully." },
      { status: 201 }
    );
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to create steel material." }, { status: 500 });
  }
}
