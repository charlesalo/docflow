"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ShareEntry = {
  id: string;
  permission: string;
  user: { id: string; name: string; username: string };
};

type Candidate = { id: string; name: string; username: string };

export function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [shares, setShares] = useState<ShareEntry[] | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [username, setUsername] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("edit");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [updatingUsername, setUpdatingUsername] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch(`/api/documents/${documentId}`);
    const data = await res.json();
    if (res.ok) setShares(data.document.shares);
  }

  async function loadCandidates() {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setCandidates(data.users);
  }

  useEffect(() => {
    load();
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  const alreadySharedUsernames = useMemo(
    () => new Set((shares ?? []).map((s) => s.user.username)),
    [shares]
  );

  const isValidUsername = useMemo(() => {
    const query = username.trim().toLowerCase();
    if (!query) return false;
    return candidates.some((c) => c.username.toLowerCase() === query);
  }, [username, candidates]);

  const suggestions = useMemo(() => {
    const query = username.trim().toLowerCase();
    return candidates
      .filter((c) => !alreadySharedUsernames.has(c.username))
      .filter(
        (c) =>
          query.length === 0 ||
          c.username.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query)
      )
      .slice(0, 6);
  }, [candidates, username, alreadySharedUsernames]);

  function selectSuggestion(candidate: Candidate) {
    setUsername(candidate.username);
    setSuggestionsOpen(false);
    inputRef.current?.focus();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && activeIndex < suggestions.length) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidUsername) return;
    setSubmitting(true);
    setError(null);
    setSuggestionsOpen(false);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), permission }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share document");
      setUsername("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not share document");
    } finally {
      setSubmitting(false);
    }
  }

  async function updatePermission(targetUsername: string, newPermission: "view" | "edit") {
    setUpdatingUsername(targetUsername);
    setError(null);
    // optimistic update so the select feels instant
    setShares((prev) =>
      prev
        ? prev.map((s) => (s.user.username === targetUsername ? { ...s, permission: newPermission } : s))
        : prev
    );
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername, permission: newPermission }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update permission");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update permission");
      await load(); // roll back the optimistic update on failure
    } finally {
      setUpdatingUsername(null);
    }
  }

  async function revoke(targetUsername: string) {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: targetUsername }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not revoke access");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke access");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Share document</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={addShare} className="mt-4 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setActiveIndex(0);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => {
                // delay so a suggestion click's onMouseDown can fire first
                setTimeout(() => setSuggestionsOpen(false), 100);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="username (e.g. bob)"
              autoComplete="off"
              role="combobox"
              aria-expanded={suggestionsOpen && suggestions.length > 0}
              aria-autocomplete="list"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            {suggestionsOpen && suggestions.length > 0 ? (
              <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
                {suggestions.map((candidate, index) => (
                  <li key={candidate.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(candidate);
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                        index === activeIndex ? "bg-zinc-100" : "bg-white"
                      }`}
                    >
                      <span className="font-medium text-zinc-900">{candidate.name}</span>
                      <span className="text-xs text-zinc-500">@{candidate.username}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value as "view" | "edit")}
            className="rounded-md border border-zinc-300 px-2 py-2 text-sm"
          >
            <option value="edit">Can edit</option>
            <option value="view">View only</option>
          </select>
          <button
            type="submit"
            disabled={submitting || !isValidUsername}
            title={!isValidUsername ? "Enter a valid username to add" : undefined}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">People with access</h4>
          {shares === null ? (
            <p className="mt-2 text-sm text-zinc-500">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Only you have access right now.</p>
          ) : (
            <ul className="mt-2 divide-y divide-zinc-100">
              {shares.map((share) => (
                <li key={share.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-zinc-900">
                    {share.user.name} <span className="text-zinc-400">@{share.user.username}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={share.permission}
                      disabled={updatingUsername === share.user.username}
                      onChange={(e) =>
                        updatePermission(share.user.username, e.target.value as "view" | "edit")
                      }
                      aria-label={`Permission for ${share.user.name}`}
                      className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 disabled:opacity-60"
                    >
                      <option value="edit">Can edit</option>
                      <option value="view">View only</option>
                    </select>
                    <button
                      onClick={() => revoke(share.user.username)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
