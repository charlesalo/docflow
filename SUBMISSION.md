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

Note on persistence: this deployment uses SQLite on Render's free tier — a single always-on container with a real writable disk, so documents/shares/edits persist normally across refreshes, repeat visits, and redeploys — confirmed directly: live data survived multiple git-push-triggered redeploys during development without resetting. The one untested edge case: Render's free tier spins a service down after ~15 minutes of no traffic, and a cold restart from that *could* land on a fresh disk. If that ever happens, `prisma/ensure-seed.ts` reseeds the three demo accounts automatically on boot (only when the database is empty, so it can never wipe data mid-session). See `ARCHITECTURE.md` for why SQLite was kept over a hosted Postgres for this scope.

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
- Automated tests: `lib/access.test.ts` (owner/edit/view/none permission resolution), `lib/import.test.ts` (file-import parsing and XSS-sanitization), `lib/versions.test.ts` (version-checkpoint throttle rule) — run via `npm test` (15/15 passing)

## Feature status

All five required capability areas are implemented and were verified against the live deployment (not just locally): document creation/rename/edit/reopen with rich-text formatting, `.txt`/`.md` file import, owner/edit/view sharing, and persistence across refresh. See `README.md` → "What's intentionally out of scope" for the deliberate cuts (real-time collaboration, `.docx` import, comments/PDF export — all named as optional stretch in the brief).

**Stretch feature:** document version history — automatic throttled checkpoints plus a manual "Save version now," with a History panel to preview and restore any checkpoint. See `README.md` → "Version history" and `ARCHITECTURE.md` for why this was the one stretch item picked and a design bug caught during testing (an earlier version snapshotted pre-edit instead of post-edit, which made restores return stale content — fixed and re-verified end-to-end before shipping).

If given another 2-4 hours, next priorities are listed at the end of `ARCHITECTURE.md`: real auth, named/labeled versions on top of the checkpoint trail, and `.docx` import.
