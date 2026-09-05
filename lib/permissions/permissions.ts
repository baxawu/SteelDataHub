import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  mustChangePassword: boolean;
};

/**
 * Lấy user hiện tại từ session (server-side).
 * Trả về null nếu chưa đăng nhập.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

/**
 * Bắt buộc phải đăng nhập. Throw lỗi 401 nếu không có session.
 * Dùng trong API routes / server actions.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new PermissionError("UNAUTHORIZED", "Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  return user;
}

/**
 * Bắt buộc phải là ADMIN. Throw lỗi 403 nếu không phải.
 * ĐÂY LÀ CHECK BẮT BUỘC ở mọi API route Add/Edit/Delete/User Management —
 * không được chỉ dựa vào việc ẩn nút ở frontend.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new PermissionError("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này.");
  }
  return user;
}

export class PermissionError extends Error {
  status: number;
  constructor(kind: "UNAUTHORIZED" | "FORBIDDEN", message: string) {
    super(message);
    this.name = "PermissionError";
    this.status = kind === "UNAUTHORIZED" ? 401 : 403;
  }
}

/**
 * Helper để dùng trong route handler: bắt PermissionError và trả về
 * NextResponse với đúng status code (401/403) thay vì để lỗi rơi ra 500.
 */
export function permissionErrorResponse(error: unknown) {
  if (error instanceof PermissionError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}
