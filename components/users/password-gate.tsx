"use client";

import { useState } from "react";

// Section 20: "Enter Admin Password" gate trước khi cho vào trang User Management.
export function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/users/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);

    if (res.status === 429) {
      setError("Thử lại quá nhiều lần, vui lòng đợi 1 phút.");
      return;
    }
    const data = await res.json();
    if (data.ok) {
      setUnlocked(true);
    } else {
      setError("Mật khẩu không đúng.");
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="p-4 sm:p-6 flex items-center justify-center min-h-[60vh]">
      <form onSubmit={handleSubmit} className="w-full max-w-xs border border-border rounded-lg p-6">
        <h2 className="font-medium mb-1">Xác thực Admin</h2>
        <p className="text-sm text-muted-foreground mb-4">Nhập lại mật khẩu để truy cập User Management.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin Password"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm mb-3"
          autoFocus
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? "Đang kiểm tra..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
