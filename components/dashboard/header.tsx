"use client";

import { signOut } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";

export function Header({ user }: { user: { name: string; email: string; role: string } }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/steel?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-background/95 backdrop-blur z-10">
      <form onSubmit={handleSearch} className="flex-1 max-w-md ml-10 lg:ml-0">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm nhanh: A36, S355, H-Beam..."
          className="w-full rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </form>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="p-2 rounded-md hover:bg-muted" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <ThemeToggle />
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.role === "ADMIN" ? "Admin" : "User"}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-md hover:bg-muted text-muted-foreground"
          title="Đăng xuất"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
