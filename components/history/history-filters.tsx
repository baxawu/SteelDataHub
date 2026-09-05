"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "RESTORE", "IMPORT", "EXPORT", "LOGIN", "LOGOUT", "ROLE_CHANGE", "USER_CREATE", "USER_DELETE", "PASSWORD_CHANGE"];

export function HistoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setAction(action: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (action) params.set("action", action); else params.delete("action");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setAction("")}
        className={`text-xs px-3 py-1.5 rounded-full border ${!searchParams.get("action") ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
      >
        All
      </button>
      {ACTIONS.map((a) => (
        <button
          key={a}
          onClick={() => setAction(a)}
          className={`text-xs px-3 py-1.5 rounded-full border ${searchParams.get("action") === a ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
