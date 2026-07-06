# Submission

## Live product URL

**https://ajaia-docs-6z8d.onrender.com** (Render free web service)

No signup required — the login screen lists three seeded accounts, click a name to sign in (no password).

| Name | Username | Notes |
|---|---|---|
| Alice Nakamura | `alice` | Owns "Welcome to Ajaia Docs" (shared with Bob, edit access) |
| Bob Okafor | `bob` | Owns "Bob's Draft Notes"; has edit access to Alice's welcome doc |
| Carol Mendes | `carol` | Owns "Carol's Meeting Notes"; no shares yet |

Use the "Switch user" link in the header to try the same document from a different account's perspective (owner vs. shared-editor).

Note on persistence: this deployment uses SQLite on Render's free tier — a single always-on container with a real writable disk, so documents/shares/edits persist normally across refreshes and repeat visits. The one caveat (documented, not hidden): the disk resets on a redeploy or if Render spins the free instance down after inactivity and restarts it — at that point the app reseeds the three demo accounts automatically (`prisma/ensure-seed.ts` runs on boot and only seeds if the database is empty, so it never wipes data mid-session). See `ARCHITECTURE.md` for why SQLite was kept over a hosted Postgres for this scope.

## Walkthrough video

See `walkthrough-video-url.txt` for the link.

## What's included in this folder / repo

- Full source code (Next.js 16 App Router + TypeScript, Prisma/SQLite, Tiptap editor)
- `README.md` — setup/run instructions, seeded accounts, feature scope, test instructions
- `ARCHITECTURE.md` — what was prioritized/deprioritized and why, data model, known limitations
- `AI_WORKFLOW.md` — AI usage summary (tools, speedups, rejected output, verification method)
- `notes/ai-usage-log.md` — raw chronological AI usage log
- `SUBMISSION.md` — this file
- `walkthrough-video-url.txt` — the recorded walkthrough link
- `render.yaml` — deployment blueprint (Render free web service)
- Automated tests: `lib/access.test.ts` (owner/edit/view/none permission resolution), `lib/import.test.ts` (file-import parsing and XSS-sanitization) — run via `npm test` (12/12 passing)

## Feature status

All five required capability areas are implemented and were verified against the live deployment (not just locally): document creation/rename/edit/reopen with rich-text formatting, `.txt`/`.md` file import, owner/edit/view sharing, and persistence across refresh. See `README.md` → "What's intentionally out of scope" for the deliberate cuts (real-time collaboration, `.docx` import, comments/version history/PDF export — all named as optional stretch in the brief).

If given another 2-4 hours, next priorities are listed at the end of `ARCHITECTURE.md`: real auth, document revision history, and `.docx` import.
