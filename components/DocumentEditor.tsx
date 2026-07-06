"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { ShareDialog } from "@/components/ShareDialog";

type SaveState = "idle" | "saving" | "saved" | "error";

export function DocumentEditor({
  documentId,
  initialTitle,
  initialContent,
  canEdit,
  isOwner,
  owner,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  canEdit: boolean;
  isOwner: boolean;
  owner: { name: string; username: string };
}) {
  const [title, setTitle] = useState(initialTitle);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePatch = useCallback(
    async (patch: { title?: string; content?: string }) => {
      setSaveState("saving");
      try {
        const res = await fetch(`/api/documents/${documentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("save failed");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    },
    [documentId]
  );

  const scheduleSave = useCallback(
    (patch: { title?: string; content?: string }) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => savePatch(patch), 600);
    },
    [savePatch]
  );

  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      scheduleSave({ content: editor.getHTML() });
    },
    editorProps: {
      attributes: {
        class: "prose prose-zinc max-w-none focus:outline-none min-h-[60vh] px-1",
      },
    },
  });

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTitle(value);
    scheduleSave({ title: value || "Untitled document" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/documents" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← My documents
        </Link>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <SaveIndicator state={saveState} />
          {isOwner ? (
            <button
              onClick={() => setShareOpen(true)}
              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Share
            </button>
          ) : (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              Shared by {owner.name} · {canEdit ? "Can edit" : "View only"}
            </span>
          )}
        </div>
      </div>

      <input
        value={title}
        onChange={handleTitleChange}
        disabled={!canEdit}
        className="w-full border-none bg-transparent text-2xl font-semibold text-zinc-900 outline-none disabled:opacity-80"
        aria-label="Document title"
      />

      {canEdit ? <Toolbar editor={editor} /> : null}

      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <EditorContent editor={editor} />
      </div>

      {shareOpen ? <ShareDialog documentId={documentId} onClose={() => setShareOpen(false)} /> : null}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return null;
  const label = { saving: "Saving…", saved: "Saved", error: "Couldn't save" }[state];
  const color = state === "error" ? "text-red-600" : "text-zinc-400";
  return <span className={color}>{label}</span>;
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const buttons: { label: string; onClick: () => void; isActive: () => boolean }[] = [
    { label: "B", onClick: () => editor.chain().focus().toggleBold().run(), isActive: () => editor.isActive("bold") },
    { label: "I", onClick: () => editor.chain().focus().toggleItalic().run(), isActive: () => editor.isActive("italic") },
    { label: "U", onClick: () => editor.chain().focus().toggleUnderline().run(), isActive: () => editor.isActive("underline") },
    { label: "H1", onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: () => editor.isActive("heading", { level: 1 }) },
    { label: "H2", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: () => editor.isActive("heading", { level: 2 }) },
    { label: "¶", onClick: () => editor.chain().focus().setParagraph().run(), isActive: () => editor.isActive("paragraph") },
    { label: "• List", onClick: () => editor.chain().focus().toggleBulletList().run(), isActive: () => editor.isActive("bulletList") },
    { label: "1. List", onClick: () => editor.chain().focus().toggleOrderedList().run(), isActive: () => editor.isActive("orderedList") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.onClick}
          className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition ${
            btn.isActive() ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {btn.label}
        </button>
      ))}
      <span className="mx-1 h-5 w-px bg-zinc-200" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Redo
      </button>
    </div>
  );
}
