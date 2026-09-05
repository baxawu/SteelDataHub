import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireUser, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";

// GET /api/steel/export — Export Excel (Section 26). Admin/User đều export được theo quyền view.
// Hỗ trợ "All data" (không filter), "Filtered data" (query params giống trang Steel Database),
// hoặc "Selected data" (truyền ids=id1,id2,...).
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const sp = req.nextUrl.searchParams;
    const idsParam = sp.get("ids");

    let items;
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      items = await prisma.steelMaterial.findMany({
        where: { id: { in: ids } },
        include: { standard: true, category: true },
      });
    } else {
      const q = sp.get("q")?.trim();
      const standard = sp.get("standard");
      const category = sp.get("category");
      const shape = sp.get("shape");
      const status = sp.get("status");

      const where: Prisma.SteelMaterialWhereInput = {
        AND: [
          q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { grade: { contains: q, mode: "insensitive" } }] } : {},
          standard ? { standard: { name: standard } } : {},
          category ? { category: { slug: category } } : {},
          shape ? { shape: { equals: shape, mode: "insensitive" } } : {},
          status && status !== "ALL" ? { status: status as any } : {},
        ],
      };
      items = await prisma.steelMaterial.findMany({
        where,
        include: { standard: true, category: true },
        orderBy: { updatedAt: "desc" },
      });
    }

    const rows = items.map((s) => {
      const chem = (s.chemicalComposition as Record<string, number>) || {};
      return {
        "Steel Name": s.name,
        "Steel Grade": s.grade,
        "Steel Code": s.code,
        Standard: s.standard.name,
        Category: s.category.name,
        "Material Type": s.materialType,
        Shape: s.shape,
        Country: s.country || "",
        "Yield Strength (MPa)": s.yieldStrength ?? "",
        "Tensile Strength (MPa)": s.tensileStrength ?? "",
        "Elongation (%)": s.elongation ?? "",
        "Density (kg/m3)": s.density ?? "",
        Hardness: s.hardness || "",
        "C (%)": chem.C ?? "",
        "Mn (%)": chem.Mn ?? "",
        "Si (%)": chem.Si ?? "",
        "P (%)": chem.P ?? "",
        "S (%)": chem.S ?? "",
        "Cr (%)": chem.Cr ?? "",
        "Ni (%)": chem.Ni ?? "",
        "Mo (%)": chem.Mo ?? "",
        "Thickness Min (mm)": s.thicknessMin ?? "",
        "Thickness Max (mm)": s.thicknessMax ?? "",
        "Width (mm)": s.width ?? "",
        "Length (mm)": s.length ?? "",
        "Diameter (mm)": s.diameter ?? "",
        "Weight (kg/m)": s.weight ?? "",
        Status: s.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Steel Data");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    await logChange({ userId: user.id, action: "EXPORT", fieldName: "steel", newValue: `${rows.length} rows` });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="steel-data-export-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Unable to export data." }, { status: 500 });
  }
}
