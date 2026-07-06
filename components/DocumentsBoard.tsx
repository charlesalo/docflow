"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShareDialog } from "@/components/ShareDialog";

type OwnedDoc = { id: string; title: string; updatedAt: string; createdAt: string };
type SharedDoc = OwnedDoc & { owner: { name: string; username: string }; permission: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DocumentsBoard({
  initialOwned,
  initialShared,
}: {
  initialOwned: OwnedDoc[];
  initialShared: SharedDoc[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [owned, setOwned] = useState(initialOwned);
  const [shared] = useState(initialShared);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareDocId, setShareDocId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function createDocument() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create document");
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create document");
      setCreating(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not delete document");
      }
      setOwned((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete document");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={createDocument}
          disabled={creating}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {creating ? "Creating…" : "+ New document"}
        </button>
        <label className="cursor-pointer rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          {uploading ? "Importing…" : "Upload .txt / .md"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">My documents</h2>
        {owned.length === 0 ? (
          <p className="text-sm text-zinc-500">No documents yet — create one to get started.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {owned.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <a href={`/documents/${doc.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900">{doc.title}</div>
                  <div className="text-xs text-zinc-500">Updated {formatDate(doc.updatedAt)}</div>
                </a>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">Owner</span>
                  <button
                    onClick={() => setShareDocId(doc.id)}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Share
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    disabled={deletingId === doc.id}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingId === doc.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">Shared with me</h2>
        {shared.length === 0 ? (
          <p className="text-sm text-zinc-500">No documents have been shared with you yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
            {shared.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <a href={`/documents/${doc.id}`} className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-zinc-900">{doc.title}</div>
                  <div className="text-xs text-zinc-500">
                    Shared by {doc.owner.name} · Updated {formatDate(doc.updatedAt)}
                  </div>
                </a>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {doc.permission === "edit" ? "Can edit" : "View only"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {shareDocId ? <ShareDialog documentId={shareDocId} onClose={() => setShareDocId(null)} /> : null}
    </div>
  );
}
