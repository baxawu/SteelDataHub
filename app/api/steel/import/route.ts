import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { logChange } from "@/lib/audit";
import { CHEMICAL_FIELDS } from "@/lib/excel";

// POST /api/steel/import — Import Excel (Section 25). CHỈ ADMIN.
// Client đã parse file Excel thành JSON rows (dùng thư viện xlsx ở trình duyệt) và preview
// cho Admin xem trước; endpoint này validate lại lần nữa ở server rồi mới ghi database
// (không tin tưởng dữ liệu preview phía client).
// Body: { rows: Array<Record<string, any>>, mode: "preview" | "import" }
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const { rows, mode } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "File Excel không có dữ liệu." }, { status: 400 });
    }
    if (rows.length > 5000) {
      return NextResponse.json({ error: "Tối đa 5000 dòng mỗi lần import." }, { status: 400 });
    }

    const [standards, categories] = await Promise.all([
      prisma.standard.findMany(),
      prisma.steelCategory.findMany(),
    ]);
    const standardByName = new Map(standards.map((s) => [s.name.toLowerCase(), s]));
    const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    const results: { row: number; status: "ok" | "error"; message?: string; data?: any }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // dòng 1 là header trong Excel

      const name = String(r["Steel Name"] || "").trim();
      const grade = String(r["Steel Grade"] || "").trim();
      const code = String(r["Steel Code"] || "").trim();
      const standardName = String(r["Standard"] || "").trim();
      const categoryName = String(r["Category"] || "").trim();
      const materialType = String(r["Material Type"] || "").trim();
      const shape = String(r["Shape"] || "").trim();

      if (!name || !grade || !code || !standardName || !categoryName || !materialType || !shape) {
        results.push({ row: rowNum, status: "error", message: "Thiếu trường bắt buộc (Name/Grade/Code/Standard/Category/MaterialType/Shape)." });
        continue;
      }

      const standard = standardByName.get(standardName.toLowerCase());
      if (!standard) {
        results.push({ row: rowNum, status: "error", message: `Standard "${standardName}" không tồn tại trong hệ thống.` });
        continue;
      }
      const category = categoryByName.get(categoryName.toLowerCase());
      if (!category) {
        results.push({ row: rowNum, status: "error", message: `Category "${categoryName}" không tồn tại trong hệ thống.` });
        continue;
      }

      // Chống duplicate Grade + Standard (Section 44)
      const existing = await prisma.steelMaterial.findUnique({
        where: { uniq_grade_standard: { grade, standardId: standard.id } },
      });
      if (existing) {
        results.push({ row: rowNum, status: "error", message: `Grade "${grade}" đã tồn tại cho Standard "${standardName}".` });
        continue;
      }

      const chemicalComposition: Record<string, number> = {};
      for (const el of CHEMICAL_FIELDS) {
        const val = r[`${el} (%)`];
        if (val !== undefined && val !== null && val !== "") {
          const num = parseFloat(val);
          if (!Number.isNaN(num)) chemicalComposition[el] = num;
        }
      }

      const parsedRow = {
        name, grade, code,
        standardId: standard.id,
        categoryId: category.id,
        materialType, shape,
        country: r["Country"] ? String(r["Country"]) : undefined,
        yieldStrength: toNum(r["Yield Strength (MPa)"]),
        tensileStrength: toNum(r["Tensile Strength (MPa)"]),
        elongation: toNum(r["Elongation (%)"]),
        density: toNum(r["Density (kg/m3)"]),
        hardness: r["Hardness"] ? String(r["Hardness"]) : undefined,
        chemicalComposition,
        thicknessMin: toNum(r["Thickness Min (mm)"]),
        thicknessMax: toNum(r["Thickness Max (mm)"]),
        width: toNum(r["Width (mm)"]),
        length: toNum(r["Length (mm)"]),
        diameter: toNum(r["Diameter (mm)"]),
        weight: toNum(r["Weight (kg/m)"]),
        status: (["ACTIVE", "DRAFT", "ARCHIVED"].includes(r["Status"]) ? r["Status"] : "DRAFT") as "ACTIVE" | "DRAFT" | "ARCHIVED",
      };

      if (mode === "import") {
        const created = await prisma.steelMaterial.create({
          data: { ...parsedRow, createdById: admin.id, updatedById: admin.id },
        });
        results.push({ row: rowNum, status: "ok", data: created });
      } else {
        results.push({ row: rowNum, status: "ok", data: parsedRow });
      }
    }

    const okCount = results.filter((r) => r.status === "ok").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    if (mode === "import" && okCount > 0) {
      await logChange({
        userId: admin.id,
        action: "IMPORT",
        fieldName: "steel",
        newValue: `${okCount} imported, ${errorCount} skipped`,
      });
    }

    return NextResponse.json({
      results,
      summary: { total: rows.length, ok: okCount, error: errorCount },
      message: mode === "import" ? `${okCount} steel materials imported successfully.` : undefined,
    });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    console.error(error);
    return NextResponse.json({ error: "Invalid Excel format." }, { status: 400 });
  }
}

function toNum(v: any): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isNaN(n) ? undefined : n;
}
