"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

// Đổi mật khẩu (Section 18). Nếu mustChangePassword=true, hiển thị cảnh báo bắt buộc.
export function ChangePasswordForm({ mustChangePassword }: { mustChangePassword: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu mới tối thiểu 8 ký tự.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/users/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Không thể đổi mật khẩu.");
      return;
    }

    setSuccess(true);
    // Bắt buộc đăng nhập lại với mật khẩu mới để session phản ánh mustChangePassword=false.
    setTimeout(() => signOut({ callbackUrl: "/login?passwordChanged=true" }), 1500);
  }

  return (
    <div className="max-w-md border border-border rounded-lg p-6">
      <h2 className="font-medium mb-1">Đổi mật khẩu</h2>
      {mustChangePassword ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          Bạn đang dùng mật khẩu mặc định. Vui lòng đổi mật khẩu để tiếp tục sử dụng hệ thống an toàn.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">Cập nhật mật khẩu đăng nhập của bạn.</p>
      )}

      {success ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Đổi mật khẩu thành công. Đang đăng xuất để đăng nhập lại...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mật khẩu hiện tại</label>
            <input
              type="password" required value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Mật khẩu mới (tối thiểu 8 ký tự)</label>
            <input
              type="password" required minLength={8} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password" required value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit" disabled={saving}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </form>
      )}
    </div>
  );
}
