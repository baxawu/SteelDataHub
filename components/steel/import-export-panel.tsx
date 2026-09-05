"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

type ImportResult = {
  row: number;
  status: "ok" | "error";
  message?: string;
  data?: any;
};

// Import Excel (Section 25) + Export Excel (Section 26). Chỉ Admin thấy phần Import.
export function ImportExportPanel({ isAdmin }: { isAdmin: boolean }) {
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [fileName, setFileName] = useState("");
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; ok: number; error: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResults(null);
    setSummary(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (json.length === 0) {
          setError("File Excel không có dữ liệu.");
          return;
        }
        setRows(json as Record<string, any>[]);
        validate(json as Record<string, any>[]);
      } catch {
        setError("Invalid Excel format.");
      }
    };
    reader.readAsBinaryString(file);
  }

  async function validate(data: Record<string, any>[]) {
    setLoading(true);
    const res = await fetch("/api/steel/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: data, mode: "preview" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Invalid Excel format.");
      return;
    }
    const json = await res.json();
    setResults(json.results);
    setSummary(json.summary);
  }

  async function handleImport() {
    setLoading(true);
    const res = await fetch("/api/steel/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows, mode: "import" }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Unable to import data.");
      return;
    }
    const json = await res.json();
    setSummary(json.summary);
    setResults(json.results);
    setToast(json.message || `${json.summary.ok} steel materials imported successfully.`);
    setTimeout(() => setToast(null), 4000);
    setRows([]);
  }

  function cancel() {
    setRows([]);
    setResults(null);
    setSummary(null);
    setFileName("");
  }

  async function handleExport(kind: "all") {
    const res = await fetch(`/api/steel/export`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `steel-data-export.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md bg-green-600 text-white text-sm px-4 py-2 shadow-lg">
          {toast}
        </div>
      )}

      {isAdmin && (
        <div className="border border-border rounded-lg p-5">
          <h2 className="font-medium mb-1">Import Excel</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Upload file .xlsx / .xls. Hệ thống sẽ đọc, validate và cho xem trước trước khi import.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <label className="rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
              Chọn file
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
            </label>
            {fileName && <span className="text-sm text-muted-foreground">{fileName}</span>}
            <a href="/api/steel/template" className="text-sm text-primary hover:underline ml-auto">
              Download Template
            </a>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Đang xử lý...</p>}

          {summary && (
            <div className="mb-4 flex gap-4 text-sm">
              <span>Tổng: <strong>{summary.total}</strong></span>
              <span className="text-green-700">Hợp lệ: <strong>{summary.ok}</strong></span>
              <span className="text-red-600">Lỗi: <strong>{summary.error}</strong></span>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="max-h-80 overflow-y-auto border border-border rounded-md mb-4">
              <table className="w-full text-xs">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Row</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.row} className="border-t border-border">
                      <td className="p-2">{r.row}</td>
                      <td className="p-2">
                        {r.status === "ok" ? (
                          <span className="text-green-700">OK</span>
                        ) : (
                          <span className="text-red-600">Error</span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {r.status === "ok" ? `${r.data?.name || ""} (${r.data?.grade || ""})` : r.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > 0 && summary && summary.ok > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={loading}
                className="rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 disabled:opacity-60"
              >
                Import {summary.ok} hợp lệ
              </button>
              <button onClick={cancel} className="rounded-md border border-border text-sm px-4 py-2">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border border-border rounded-lg p-5">
        <h2 className="font-medium mb-1">Export Excel</h2>
        <p className="text-sm text-muted-foreground mb-4">Xuất toàn bộ dữ liệu thép ra file Excel.</p>
        <button onClick={() => handleExport("all")} className="rounded-md border border-border text-sm px-4 py-2">
          Export All Data (.xlsx)
        </button>
      </div>
    </div>
  );
}
