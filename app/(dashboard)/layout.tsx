import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MustChangePasswordBanner } from "@/components/dashboard/must-change-password-banner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        {user.mustChangePassword && <MustChangePasswordBanner />}
        <Header user={user} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
