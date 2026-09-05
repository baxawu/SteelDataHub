import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { ImportExportPanel } from "@/components/steel/import-export-panel";

// IMPORT / EXPORT EXCEL (Section 25, 26)
export default async function ImportExportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Import / Export Excel</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {user.role === "ADMIN"
          ? "Import dữ liệu thép hàng loạt từ Excel, hoặc export dữ liệu hiện có."
          : "Export dữ liệu thép ra Excel."}
      </p>
      <ImportExportPanel isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
