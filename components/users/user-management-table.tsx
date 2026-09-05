"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string; name: string; email: string; role: "ADMIN" | "USER"; status: "ACTIVE" | "DISABLED";
  createdAt: string; lastLoginAt: string | null;
};

export function UserManagementTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(u: UserRow) {
    setBusyId(u.id);
    await fetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: u.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function changeRole(u: UserRow, role: "ADMIN" | "USER") {
    setBusyId(u.id);
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Không thể đổi role.");
    }
    router.refresh();
  }

  async function deleteUser(u: UserRow) {
    if (!confirm(`Xóa tài khoản ${u.email}?`)) return;
    setBusyId(u.id);
    const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Không thể xóa user.");
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{users.length} người dùng</p>
        <button onClick={() => setShowAdd(true)} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
          Create User
        </button>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Last Login</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.name} {u.id === currentUserId && <span className="text-xs text-muted-foreground">(you)</span>}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    disabled={busyId === u.id || u.id === currentUserId}
                    onChange={(e) => changeRole(u, e.target.value as "ADMIN" | "USER")}
                    className="rounded border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("vi-VN") : "—"}
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={busyId === u.id || u.id === currentUserId}
                      onClick={() => toggleStatus(u)}
                      className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40"
                    >
                      {u.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                    <button
                      disabled={busyId === u.id || u.id === currentUserId}
                      onClick={() => deleteUser(u)}
                      className="text-xs px-2 py-1 rounded border border-border text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <CreateUserModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); router.refresh(); }} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Không thể tạo user.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={submit} className="bg-background border border-border rounded-lg p-6 w-full max-w-sm space-y-3">
        <h2 className="font-medium">Create User</h2>
        <input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <input required type="password" placeholder="Temporary Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
        <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="flex-1 rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60">
            {saving ? "Đang tạo..." : "Create"}
          </button>
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border py-2 text-sm">Cancel</button>
        </div>
      </form>
    </div>
  );
}
