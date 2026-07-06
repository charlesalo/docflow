# Architecture Note

## Context and constraint

This was built against a hard ~4 hour timebox (see `CLAUDE.md`), not the brief's looser "4-6 hours." Every choice below optimized for **a coherent, correctly-working slice** over broad feature coverage.

## What I prioritized

1. **Correctness of the access model over editor sophistication.** The sharing/permission logic (owner vs. edit-share vs. view-share vs. no access) is the one part of this app where a subtle bug is a real product failure — someone seeing or editing a document they shouldn't. Every document API route resolves access through a single function (`lib/access.ts`) rather than re-deriving permission checks per-route, and it's the one piece covered by a dedicated test suite (`lib/access.test.ts`) with five permission-boundary cases.
2. **A real editor, not a textarea.** Tiptap gives bold/italic/underline/headings/lists with an actual toolbar and undo/redo, which is what "should feel usable and coherent" in the brief means in practice — a `<textarea>` with markdown syntax would have been faster to build but would fail that bar.
3. **File import that's actually safe.** Uploaded `.md`/`.txt` content is parsed (via `marked`) and then run through DOMPurify before it ever reaches the database or the editor — an uploaded file is untrusted input, and it's the one place in the app where arbitrary user-supplied HTML/script content could otherwise land.
4. **Debounced autosave over an explicit save button.** Matches how Google Docs actually feels, and it's a small implementation cost (a 600ms `setTimeout` debounce) for a meaningfully better UX.

## What I deprioritized, and why

- **Real authentication.** The brief explicitly allows simulated users for this scope, and building real password/OAuth auth would have consumed a disproportionate share of a 4-hour budget for a requirement that isn't what's being evaluated. Auth is isolated behind `lib/auth.ts`'s `getCurrentUser()`, so swapping in real sessions later doesn't touch the document/sharing logic at all.
- **Real-time collaboration.** Explicitly listed as optional stretch. Out of scope here; autosave-on-edit was the right-sized substitute.
- **`.docx` import.** Parsing `.docx` (a zipped XML format) reliably is a meaningfully bigger dependency/edge-case surface than plain text or Markdown. `.txt`/`.md` cover the "turn a file into an editable document" requirement without that risk, and the limitation is stated clearly in both the UI (upload button label) and the README.
- **Granular roles beyond owner/edit/view.** A `permission: "view" | "edit"` field on the `Share` model demonstrates the *pattern* of access differentiation the brief asks for, without building out an RBAC system nobody asked for.
- **Document history, comment threads, PDF export.** All named as optional stretch goals in the brief; none were started so that the required five capability areas would all be solid rather than partially covering extras.

## Data model

```
User (id, username, name)
Document (id, title, content [sanitized HTML], ownerId → User)
Share (documentId → Document, userId → User, permission: "view" | "edit")
```

`content` is stored as sanitized HTML (Tiptap's native serialization format), not a custom JSON schema — this keeps read/write trivial and means the stored value can be rendered directly without a client-side library if ever needed.

## Known limitation carried into the deployed build

SQLite via Prisma is used for persistence, per the brief's explicit allowance ("You may use any practical storage approach for this scope, including SQLite..."). Locally, and on any host that runs the app as a single long-lived process, this persists exactly as expected — verified via `npm run dev` plus a full create/edit/share/refresh pass. See `SUBMISSION.md` for how this was deployed and what tradeoff, if any, applies to the live URL under the brief's "no paid dependency for reviewers" constraint.

## What I'd build next with another 2-4 hours

- Swap the mocked cookie auth for real sessions (magic-link or a proper password flow) without changing any document/sharing code.
- Add per-document revision history (append-only snapshot table) — the sharing/access model already gates who could view it.
- Real-time presence (who else has this doc open) via a WebSocket or polling layer, ahead of full collaborative editing.
- `.docx` import via `mammoth`, behind the same `fileTextToDocumentHtml`-style sanitization path already in place for `.md`/`.txt`.
