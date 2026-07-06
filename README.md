# Ajaia Docs

> Built as a take-home assessment for Ajaia's AI-Native Full Stack Developer role. See `Assessment_Brief.md` for the original prompt, `ARCHITECTURE.md` for design tradeoffs, and `AI_WORKFLOW.md` for how AI tools were used.

A lightweight, Google-Docs-style collaborative document editor: create and rename documents, edit with rich-text formatting, import `.txt`/`.md` files as new documents, share documents with other users, and persist everything across refreshes.

## Stack

- **Next.js 16** (App Router, TypeScript) — frontend + API routes in one app
- **Prisma + SQLite** — persistence (file-based, zero external services)
- **Tiptap** — rich-text editor (bold, italic, underline, headings, lists)
- **Zod** — request validation
- **Vitest** — automated tests
- Mock authentication (seeded users, no passwords) — see [Auth model](#auth-model)

## Getting started

Requires Node.js 20+.

```bash
npm install
cp .env.example .env        # if .env doesn't already exist — sets DATABASE_URL to a local SQLite file
npm run db:migrate           # creates prisma/dev.db and applies the schema
npm run db:seed              # seeds 3 demo users and a few sample documents
npm run dev                  # http://localhost:3000
```

Visit `http://localhost:3000` — you'll land on a login screen listing the seeded accounts (no password needed, click a name to sign in).

## Seeded demo accounts

| Name | Username | Notes |
|---|---|---|
| Alice Nakamura | `alice` | Owns "Welcome to Ajaia Docs" (shared with Bob) |
| Bob Okafor | `bob` | Owns "Bob's Draft Notes"; has edit access to Alice's welcome doc |
| Carol Mendes | `carol` | Owns "Carol's Meeting Notes"; no shares yet |

Use the "Switch user" link in the header to sign in as a different seeded account and see the sharing/permission behavior from the other side.

## Running tests

```bash
npm test
```

Covers file-import parsing/sanitization (`lib/import.test.ts`) and document access-control logic — owner / edit-share / view-share / no-access (`lib/access.test.ts`).

## Feature scope

**Document editing** — create, rename, edit, autosave (debounced), reopen after refresh. Formatting: bold, italic, underline, H1/H2 headings, bullet and numbered lists, undo/redo.

**File upload** — upload a `.txt` or `.md` file to create a new document from its content. Markdown is converted to formatted HTML (headings, lists, bold/italic survive); plain text is wrapped into paragraphs. Only these two extensions are accepted — anything else is rejected with a clear error. Uploaded content is sanitized (DOMPurify) before being stored or rendered, so an uploaded file can't inject scripts into the editor.

**Sharing** — every document has one owner. Owners can grant another seeded user `view` or `edit` access by username, see who currently has access, and revoke it. The documents list visibly separates "My documents" from "Shared with me," and shared entries show the granted permission and original owner.

**Persistence** — Prisma + SQLite; documents and shares survive a refresh and a server restart in local dev.

**Auth model** — this is a scoped-down simulation, not real auth: no passwords, no signup, just a fixed list of seeded users and a cookie holding the chosen user id. This is intentional per the assessment's brief ("You may simulate users with seeded accounts... if that keeps the scope reasonable") — a real deployment would replace `lib/auth.ts` with actual session/password (or OAuth) handling without touching the rest of the app, since every route already funnels through `getCurrentUser()`.

## What's intentionally out of scope

- Real-time collaborative editing (multiple cursors/live sync) — single-editor-at-a-time autosave only.
- Enterprise-grade access control (roles beyond owner/edit/view, org-level permissions).
- File types beyond `.txt`/`.md` (no `.docx`/PDF import).
- Comment/suggestion mode, version history, PDF export.

See `ARCHITECTURE.md` for the reasoning behind these cuts and what would be built next with more time.

## Deployment

See `SUBMISSION.md` for the live deployment URL and any reviewer credentials/instructions.
