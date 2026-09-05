"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

const STANDARDS = ["ASTM", "EN", "JIS", "AS/NZS", "GB/T", "ISO"];
const STEEL_TYPES = ["Carbon Steel", "Structural Steel", "Stainless Steel", "Weathering Steel", "Alloy Steel", "Galvanized Steel"];
const SHAPES = ["Plate", "H-Beam", "I-Beam", "Channel", "Angle", "Flat Bar", "Round Bar", "Square Bar", "Rectangular Tube", "Round Pipe", "Hollow Section"];
const COUNTRIES = ["USA", "Europe", "Australia", "Japan", "Korea", "China", "Vietnam", "Other"];
const STATUSES = ["ACTIVE", "DRAFT", "ARCHIVED"];

// Section 8/46: Filter sidebar, đồng bộ vào URL query params để share/bookmark được.
export function SteelFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [local, setLocal] = useState({
    standard: searchParams.get("standard") ?? "",
    shape: searchParams.get("shape") ?? "",
    country: searchParams.get("country") ?? "",
    status: searchParams.get("status") ?? "ACTIVE",
    yieldMin: searchParams.get("yieldMin") ?? "",
    yieldMax: searchParams.get("yieldMax") ?? "",
    thicknessMin: searchParams.get("thicknessMin") ?? "",
    thicknessMax: searchParams.get("thicknessMax") ?? "",
  });

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(local).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  function reset() {
    setLocal({ standard: "", shape: "", country: "", status: "ACTIVE", yieldMin: "", yieldMax: "", thicknessMin: "", thicknessMax: "" });
    router.push(pathname);
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5 text-sm">
      <FilterGroup label="Standard">
        <select
          value={local.standard}
          onChange={(e) => setLocal((s) => ({ ...s, standard: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">Tất cả</option>
          {STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup label="Shape">
        <select
          value={local.shape}
          onChange={(e) => setLocal((s) => ({ ...s, shape: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">Tất cả</option>
          {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup label="Country / Region">
        <select
          value={local.country}
          onChange={(e) => setLocal((s) => ({ ...s, country: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="">Tất cả</option>
          {COUNTRIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FilterGroup>

      <FilterGroup label="Yield Strength (MPa)">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={local.yieldMin}
            onChange={(e) => setLocal((s) => ({ ...s, yieldMin: e.target.value }))}
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1.5" />
          <input type="number" placeholder="Max" value={local.yieldMax}
            onChange={(e) => setLocal((s) => ({ ...s, yieldMax: e.target.value }))}
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1.5" />
        </div>
      </FilterGroup>

      <FilterGroup label="Thickness (mm)">
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={local.thicknessMin}
            onChange={(e) => setLocal((s) => ({ ...s, thicknessMin: e.target.value }))}
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1.5" />
          <input type="number" placeholder="Max" value={local.thicknessMax}
            onChange={(e) => setLocal((s) => ({ ...s, thicknessMax: e.target.value }))}
            className="w-1/2 rounded-md border border-border bg-background px-2 py-1.5" />
        </div>
      </FilterGroup>

      <FilterGroup label="Status">
        <select
          value={local.status}
          onChange={(e) => setLocal((s) => ({ ...s, status: e.target.value }))}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
        >
          <option value="ALL">Tất cả</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </FilterGroup>

      <div className="flex gap-2 pt-2">
        <button onClick={apply} className="flex-1 rounded-md bg-primary text-primary-foreground py-1.5 text-sm font-medium">
          Apply Filters
        </button>
        <button onClick={reset} className="flex-1 rounded-md border border-border py-1.5 text-sm">
          Reset
        </button>
      </div>
    </aside>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export { STANDARDS, STEEL_TYPES, SHAPES, COUNTRIES, STATUSES };
