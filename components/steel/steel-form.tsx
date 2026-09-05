"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SHAPE_OPTIONS } from "./shapes";

type Standard = { id: string; name: string };
type Category = { id: string; name: string };

type SteelFormData = {
  id?: string;
  name: string; grade: string; code: string; standardId: string; categoryId: string;
  materialType: string; shape: string; country: string; description: string;
  yieldStrength: string; tensileStrength: string; elongation: string; density: string; hardness: string;
  chemicalComposition: Record<string, string>;
  thicknessMin: string; thicknessMax: string; width: string; length: string; diameter: string; weight: string;
  imageUrl: string; status: string;
};

const MATERIAL_TYPES = ["Carbon Steel", "Structural Steel", "Stainless Steel", "Weathering Steel", "Alloy Steel", "Galvanized Steel"];
const COUNTRIES = ["USA", "Europe", "Australia", "Japan", "Korea", "China", "Vietnam", "Other"];
const CHEMICAL_ELEMENTS = ["C", "Mn", "Si", "P", "S", "Cr", "Ni", "Mo", "Cu", "V", "Nb", "Ti"];

function emptyForm(): SteelFormData {
  return {
    name: "", grade: "", code: "", standardId: "", categoryId: "",
    materialType: "", shape: "", country: "", description: "",
    yieldStrength: "", tensileStrength: "", elongation: "", density: "", hardness: "",
    chemicalComposition: {},
    thicknessMin: "", thicknessMax: "", width: "", length: "", diameter: "", weight: "",
    imageUrl: "", status: "ACTIVE",
  };
}

export function SteelForm({
  standards, categories, initial,
}: {
  standards: Standard[]; categories: Category[]; initial?: Partial<SteelFormData>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<SteelFormData>({ ...emptyForm(), ...initial });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isEdit = !!form.id;

  function set<K extends keyof SteelFormData>(key: K, value: SteelFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setChem(el: string, value: string) {
    setForm((f) => ({ ...f, chemicalComposition: { ...f.chemicalComposition, [el]: value } }));
  }

  function toNumberOrNull(v: string) {
    if (v === "" || v === undefined) return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.grade.trim()) return setError("Steel Grade không được để trống.");
    if (!form.standardId) return setError("Vui lòng chọn Standard.");
    if (!form.categoryId) return setError("Vui lòng chọn Category.");

    setSaving(true);

    const chemComp: Record<string, number> = {};
    for (const [k, v] of Object.entries(form.chemicalComposition)) {
      if (v !== "" && !Number.isNaN(Number(v))) chemComp[k] = Number(v);
    }

    const payload = {
      name: form.name, grade: form.grade, code: form.code,
      standardId: form.standardId, categoryId: form.categoryId,
      materialType: form.materialType, shape: form.shape, country: form.country || undefined,
      description: form.description || undefined,
      yieldStrength: toNumberOrNull(form.yieldStrength),
      tensileStrength: toNumberOrNull(form.tensileStrength),
      elongation: toNumberOrNull(form.elongation),
      density: toNumberOrNull(form.density),
      hardness: form.hardness || undefined,
      chemicalComposition: chemComp,
      thicknessMin: toNumberOrNull(form.thicknessMin),
      thicknessMax: toNumberOrNull(form.thicknessMax),
      width: toNumberOrNull(form.width),
      length: toNumberOrNull(form.length),
      diameter: toNumberOrNull(form.diameter),
      weight: toNumberOrNull(form.weight),
      status: form.status,
    };

    const res = await fetch(isEdit ? `/api/steel/${form.id}` : "/api/steel", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Unable to save steel data.");
      return;
    }

    const data = await res.json();
    router.push(`/dashboard/steel/${data.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>}

      <FormSection title="Basic Information">
        <Grid>
          <Field label="Steel Name"><Input value={form.name} onChange={(v) => set("name", v)} /></Field>
          <Field label="Steel Grade *"><Input value={form.grade} onChange={(v) => set("grade", v)} required /></Field>
          <Field label="Steel Code"><Input value={form.code} onChange={(v) => set("code", v)} /></Field>
          <Field label="Standard *">
            <Select value={form.standardId} onChange={(v) => set("standardId", v)} options={standards.map((s) => [s.id, s.name])} placeholder="Chọn Standard" />
          </Field>
          <Field label="Category *">
            <Select value={form.categoryId} onChange={(v) => set("categoryId", v)} options={categories.map((c) => [c.id, c.name])} placeholder="Chọn Category" />
          </Field>
          <Field label="Material Type">
            <Select value={form.materialType} onChange={(v) => set("materialType", v)} options={MATERIAL_TYPES.map((t) => [t, t])} placeholder="Chọn Material Type" />
          </Field>
          <Field label="Shape">
            <Select value={form.shape} onChange={(v) => set("shape", v)} options={SHAPE_OPTIONS.map((s) => [s, s])} placeholder="Chọn Shape" />
          </Field>
          <Field label="Country / Region">
            <Select value={form.country} onChange={(v) => set("country", v)} options={COUNTRIES.map((c) => [c, c])} placeholder="Chọn Country" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(v) => set("status", v)} options={[["ACTIVE", "Active"], ["DRAFT", "Draft"], ["ARCHIVED", "Archived"]]} />
          </Field>
        </Grid>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Field>
      </FormSection>

      <FormSection title="Mechanical Properties">
        <Grid>
          <Field label="Yield Strength (MPa)"><Input type="number" value={form.yieldStrength} onChange={(v) => set("yieldStrength", v)} /></Field>
          <Field label="Tensile Strength (MPa)"><Input type="number" value={form.tensileStrength} onChange={(v) => set("tensileStrength", v)} /></Field>
          <Field label="Elongation (%)"><Input type="number" value={form.elongation} onChange={(v) => set("elongation", v)} /></Field>
          <Field label="Density (kg/m³)"><Input type="number" value={form.density} onChange={(v) => set("density", v)} /></Field>
          <Field label="Hardness"><Input value={form.hardness} onChange={(v) => set("hardness", v)} /></Field>
        </Grid>
      </FormSection>

      <FormSection title="Chemical Composition (%)">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CHEMICAL_ELEMENTS.map((el) => (
            <Field key={el} label={el}>
              <Input type="number" value={form.chemicalComposition[el] ?? ""} onChange={(v) => setChem(el, v)} />
            </Field>
          ))}
        </div>
      </FormSection>

      <FormSection title="Dimensions">
        <Grid>
          <Field label="Thickness Min (mm)"><Input type="number" value={form.thicknessMin} onChange={(v) => set("thicknessMin", v)} /></Field>
          <Field label="Thickness Max (mm)"><Input type="number" value={form.thicknessMax} onChange={(v) => set("thicknessMax", v)} /></Field>
          <Field label="Width (mm)"><Input type="number" value={form.width} onChange={(v) => set("width", v)} /></Field>
          <Field label="Length (mm)"><Input type="number" value={form.length} onChange={(v) => set("length", v)} /></Field>
          <Field label="Diameter (mm)"><Input type="number" value={form.diameter} onChange={(v) => set("diameter", v)} /></Field>
          <Field label="Weight (kg)"><Input type="number" value={form.weight} onChange={(v) => set("weight", v)} /></Field>
        </Grid>
      </FormSection>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium disabled:opacity-60">
          {saving ? "Đang lưu..." : isEdit ? "Save Changes" : "Save"}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded-md border border-border px-5 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", required }: { value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
    />
  );
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: [string, string][]; placeholder?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
      <option value="">{placeholder ?? "—"}</option>
      {options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
    </select>
  );
}
