"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SteelShapeIllustration } from "@/components/steel/shapes";

type SteelItem = {
  id: string; name: string; grade: string; code: string; shape: string;
  materialType: string; country: string | null;
  yieldStrength: number | null; tensileStrength: number | null;
  elongation: number | null; density: number | null; hardness: string | null;
  thicknessMin: number | null; thicknessMax: number | null;
  chemicalComposition: Record<string, number> | null;
  standard: { name: string };
};

// STEEL COMPARISON (Section 11): so sánh 2-4 loại thép, giá trị lấy trực tiếp từ database.
export default function ComparePage() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids") || "";
  const [items, setItems] = useState<SteelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ids) {
      setLoading(false);
      return;
    }
    fetch(`/api/steel/compare?ids=${ids}`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error);
        return r.json();
      })
      .then((d) => setItems(d.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ids]);

  const rows: [string, (i: SteelItem) => React.ReactNode][] = [
    ["Standard", (i) => i.standard?.name],
    ["Material Type", (i) => i.materialType],
    ["Shape", (i) => i.shape],
    ["Country", (i) => i.country || "—"],
    ["Yield Strength", (i) => (i.yieldStrength ? `${i.yieldStrength} MPa` : "—")],
    ["Tensile Strength", (i) => (i.tensileStrength ? `${i.tensileStrength} MPa` : "—")],
    ["Elongation", (i) => (i.elongation ? `${i.elongation}%` : "—")],
    ["Density", (i) => (i.density ? `${i.density} kg/m³` : "—")],
    ["Hardness", (i) => i.hardness || "—"],
    ["Thickness Range", (i) => (i.thicknessMin || i.thicknessMax ? `${i.thicknessMin ?? "—"}–${i.thicknessMax ?? "—"} mm` : "—")],
    ["Carbon (C)", (i) => (i.chemicalComposition?.C != null ? `${i.chemicalComposition.C}%` : "—")],
    ["Manganese (Mn)", (i) => (i.chemicalComposition?.Mn != null ? `${i.chemicalComposition.Mn}%` : "—")],
    ["Silicon (Si)", (i) => (i.chemicalComposition?.Si != null ? `${i.chemicalComposition.Si}%` : "—")],
  ];

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Steel Comparison</h1>
      <p className="text-sm text-muted-foreground mb-6">So sánh 2–4 loại thép cạnh nhau, giá trị lấy trực tiếp từ database.</p>

      {!ids && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg text-sm text-muted-foreground">
          Chưa có loại thép nào được chọn. Vào Steel Database, tick chọn (checkbox) 2–4 dòng rồi bấm "Compare Selected".
        </div>
      )}
      {loading && ids && <p className="text-sm text-muted-foreground">Đang tải...</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      {!loading && items.length >= 2 && (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 text-left w-48">Property</th>
                {items.map((i) => (
                  <th key={i.id} className="p-3 text-left min-w-[180px]">
                    <div className="w-10 h-10 mb-2"><SteelShapeIllustration shape={i.shape} /></div>
                    <p className="font-semibold">{i.grade}</p>
                    <p className="text-xs text-muted-foreground font-normal">{i.name}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, getVal]) => (
                <tr key={label} className="border-t border-border">
                  <td className="p-3 font-medium text-muted-foreground">{label}</td>
                  {items.map((i) => (
                    <td key={i.id} className="p-3">{getVal(i)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && ids && items.length === 1 && (
        <p className="text-sm text-muted-foreground mt-4">Cần ít nhất 2 loại thép để so sánh.</p>
      )}
    </div>
  );
}
