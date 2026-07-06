"use client";

import { useEffect, useState } from "react";

type VersionSummary = { id: string; title: string; createdAt: string };
type VersionDetail = VersionSummary & { content: string };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VersionHistoryDialog({
  documentId,
  canRestore,
  onClose,
  onRestored,
}: {
  documentId: string;
  canRestore: boolean;
  onClose: () => void;
  onRestored: (document: { title: string; content: string }) => void;
}) {
  const [versions, setVersions] = useState<VersionSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  async function load() {
    const res = await fetch(`/api/documents/${documentId}/versions`);
    const data = await res.json();
    if (res.ok) {
      setVersions(data.versions);
      if (data.versions.length > 0) setSelectedId((prev) => prev ?? data.versions[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    fetch(`/api/documents/${documentId}/versions/${selectedId}`)
      .then((res) => res.json())
      .then((data) => setSelected(data.version ?? null))
      .catch(() => setSelected(null));
  }, [documentId, selectedId]);

  async function saveVersionNow() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save version");
      setSelectedId(null);
      await load();
      setSelectedId(data.version.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save version");
    } finally {
      setSaving(false);
    }
  }

  async function restore(versionId: string) {
    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not restore version");
      onRestored(data.document);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not restore version");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="flex h-[32rem] w-full max-w-2xl flex-col rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Version history</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Checkpoints are saved automatically as you edit (throttled to avoid one per keystroke), or you can save one now.
        </p>

        {canRestore ? (
          <button
            onClick={saveVersionNow}
            disabled={saving}
            className="mt-3 self-start rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save version now"}
          </button>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <div className="mt-3 flex min-h-0 flex-1 gap-4">
          <div className="w-48 shrink-0 overflow-y-auto border-r border-zinc-100 pr-3">
            {versions === null ? (
              <p className="text-sm text-zinc-500">Loading…</p>
            ) : versions.length === 0 ? (
              <p className="text-sm text-zinc-500">No checkpoints yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      onClick={() => setSelectedId(version.id)}
                      className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${
                        selectedId === version.id
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {formatDate(version.createdAt)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {selected ? (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-zinc-900">{selected.title}</span>
                  {canRestore ? (
                    <button
                      onClick={() => restore(selected.id)}
                      disabled={restoring}
                      className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
                    >
                      {restoring ? "Restoring…" : "Restore this version"}
                    </button>
                  ) : null}
                </div>
                <div
                  className="prose prose-sm prose-zinc min-h-0 flex-1 overflow-y-auto rounded-md border border-zinc-100 bg-zinc-50 p-4"
                  dangerouslySetInnerHTML={{ __html: selected.content }}
                />
              </>
            ) : (
              <p className="text-sm text-zinc-500">Select a checkpoint to preview it.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
