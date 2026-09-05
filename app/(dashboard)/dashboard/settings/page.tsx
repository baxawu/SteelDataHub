import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Quản lý tài khoản của bạn.</p>

      <div className="space-y-6">
        <div className="max-w-md border border-border rounded-lg p-6">
          <h2 className="font-medium mb-3">Thông tin tài khoản</h2>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Tên:</span> {user.name}</p>
            <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
            <p><span className="text-muted-foreground">Role:</span> {user.role}</p>
          </div>
        </div>

        <ChangePasswordForm mustChangePassword={user.mustChangePassword} />
      </div>
    </div>
  );
}
