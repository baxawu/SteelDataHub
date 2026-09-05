import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/permissions/permissions";
import { prisma } from "@/lib/db/prisma";
import { PasswordGate } from "@/components/users/password-gate";
import { UserManagementTable } from "@/components/users/user-management-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Section 19/20: chỉ ADMIN mới thấy trang này (middleware.ts cũng chặn ở tầng route).
  if (user.role !== "ADMIN") redirect("/dashboard?error=forbidden");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLoginAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-semibold mb-6">User Management</h1>
      <PasswordGate>
        <UserManagementTable users={JSON.parse(JSON.stringify(users))} currentUserId={user.id} />
      </PasswordGate>
    </div>
  );
}
