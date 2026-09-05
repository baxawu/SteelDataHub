import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireAdmin, permissionErrorResponse } from "@/lib/permissions/permissions";
import { EXCEL_COLUMNS } from "@/lib/excel";

// GET /api/steel/template — Download Template cho Import Excel (Section 25). Chỉ Admin.
export async function GET() {
  try {
    await requireAdmin();

    const headers = EXCEL_COLUMNS.map((c) => c.header);
    const sampleRow = {
      "Steel Name": "ASTM A36 Sample",
      "Steel Grade": "A36",
      "Steel Code": "ASTM-A36",
      Standard: "ASTM",
      Category: "Structural Steel",
      "Material Type": "Carbon Steel",
      Shape: "Plate",
      Country: "USA",
      "Yield Strength (MPa)": 250,
      "Tensile Strength (MPa)": 400,
    };

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="steel-import-template.xlsx"`,
      },
    });
  } catch (error) {
    const permResponse = permissionErrorResponse(error);
    if (permResponse) return permResponse;
    return NextResponse.json({ error: "Unable to generate template." }, { status: 500 });
  }
}
