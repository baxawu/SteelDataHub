"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function FavoriteButton({ steelId, initialFavorited }: { steelId: string; initialFavorited: boolean }) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: favorited ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steelId }),
    });
    if (res.ok) setFavorited(!favorited);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm rounded-md border border-border px-3 py-1.5 hover:bg-muted disabled:opacity-60"
    >
      <Star size={14} fill={favorited ? "currentColor" : "none"} className={favorited ? "text-amber-500" : ""} />
      {favorited ? "Favorited" : "Add to Favorites"}
    </button>
  );
}
