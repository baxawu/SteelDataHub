// Cấu hình mapping cột Excel <-> field database (Section 25).
// Dùng chung cho cả Import (đọc) và Export/Template (ghi).
export const EXCEL_COLUMNS: { header: string; field: string; required?: boolean }[] = [
  { header: "Steel Name", field: "name", required: true },
  { header: "Steel Grade", field: "grade", required: true },
  { header: "Steel Code", field: "code", required: true },
  { header: "Standard", field: "standardName", required: true }, // vd "ASTM" — map sang standardId khi import
  { header: "Category", field: "categoryName", required: true }, // vd "Structural Steel" — map sang categoryId
  { header: "Material Type", field: "materialType", required: true },
  { header: "Shape", field: "shape", required: true },
  { header: "Country", field: "country" },
  { header: "Yield Strength (MPa)", field: "yieldStrength" },
  { header: "Tensile Strength (MPa)", field: "tensileStrength" },
  { header: "Elongation (%)", field: "elongation" },
  { header: "Density (kg/m3)", field: "density" },
  { header: "Hardness", field: "hardness" },
  { header: "C (%)", field: "C" },
  { header: "Mn (%)", field: "Mn" },
  { header: "Si (%)", field: "Si" },
  { header: "P (%)", field: "P" },
  { header: "S (%)", field: "S" },
  { header: "Cr (%)", field: "Cr" },
  { header: "Ni (%)", field: "Ni" },
  { header: "Mo (%)", field: "Mo" },
  { header: "Thickness Min (mm)", field: "thicknessMin" },
  { header: "Thickness Max (mm)", field: "thicknessMax" },
  { header: "Width (mm)", field: "width" },
  { header: "Length (mm)", field: "length" },
  { header: "Diameter (mm)", field: "diameter" },
  { header: "Weight (kg/m)", field: "weight" },
  { header: "Status", field: "status" },
];

export const CHEMICAL_FIELDS = ["C", "Mn", "Si", "P", "S", "Cr", "Ni", "Mo"];
