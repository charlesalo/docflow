"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; username: string };

export function LoginForm({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInAs(userId: string) {
    setPendingId(userId);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not sign in");
      }
      router.push("/documents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setPendingId(null);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => signInAs(user.id)}
          disabled={pendingId !== null}
          className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition ${
            user.id === currentUserId
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white hover:border-zinc-400"
          } disabled:opacity-60`}
        >
          <span>
            <span className="block font-medium">{user.name}</span>
            <span className={`block text-xs ${user.id === currentUserId ? "text-zinc-300" : "text-zinc-500"}`}>
              @{user.username}
            </span>
          </span>
          {pendingId === user.id ? <span className="text-xs">Signing in…</span> : null}
        </button>
      ))}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
