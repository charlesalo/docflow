# AI Workflow Note

## Which AI tools I used

Claude Code (Sonnet 5), operating directly in this repository as the primary build tool for the entire assessment — scaffolding, schema design, API routes, UI components, tests, and verification were all driven through it in one continuous session. Raw turn-by-turn detail is in `notes/ai-usage-log.md`; this is the summary.

## Where AI materially sped up my work

- **Boilerplate elimination.** Scaffolding Next.js/Tailwind/Prisma, writing near-identical CRUD route handlers (create/read/update/delete for documents, share/revoke for sharing), and wiring up Zod validation schemas for each endpoint — the kind of work that's mechanical but easy to get subtly wrong (missing an auth check, forgetting to validate one field) if typed by hand under time pressure.
- **End-to-end feature slices in one pass.** For each capability (editor, upload/import, sharing), Claude Code produced the API route, the client component, and the wiring between them together, which kept the request/response shape consistent without a separate reconciliation pass.
- **Fast verification loop.** Rather than eyeballing the code, it ran the actual dev server, drove the API with `curl` for every access-control edge case (owner edits, shared-editor edits, shared-viewer blocked, stranger gets 404, unauthenticated gets 401), and then drove a real headless-Chromium session (via a small Playwright script — no project-specific browser automation existed yet) to click through login → document list → editor → typing → autosave indicator → share dialog, checking for console errors. That's meaningfully more verification than "run `npm run build` and call it done."

## What AI-generated output I changed or rejected

- **Prisma major version.** The first `prisma init` pulled Prisma 7, which now requires driver adapters instead of a `url` in `schema.prisma` — a breaking change from the stable pattern. Rather than build around brand-new, less-battle-tested config surface under a 4-hour clock, I downgraded to Prisma 6, which uses the standard `datasource { url = env(...) }` pattern. Correct call for a time-boxed build; would reconsider for a longer-lived project.
- **Deployment/persistence plan.** My first instinct was to reach for a hosted Postgres (Vercel's Neon integration) to sidestep SQLite's serverless-filesystem limitations, and I'd started running `vercel link` toward that. The candidate (me) stopped this mid-stream: the brief explicitly says "Do not require reviewers to pay for a dependency or service," and while Neon's free tier doesn't cost money, it does add an extra account/integration surface that isn't needed to satisfy the constraint — SQLite plus a deployment target with a real writable filesystem (not Vercel's serverless functions, which are read-only outside `/tmp`) meets the requirement with less moving infrastructure. I redirected the build back to plain SQLite and had it flag the Vercel-filesystem limitation explicitly in `ARCHITECTURE.md`/`SUBMISSION.md` rather than silently ship something that would fail on first write.
- **Test scope.** Left to its own judgment, the assistant installed React Testing Library and jsdom in case component-level tests were needed. Once the actual tests written turned out to be pure-logic (import sanitization, access-control resolution) rather than component-rendering tests, those unused dependencies were removed rather than left in `package.json` as dead weight.

## How I verified correctness, UX quality, and implementation reliability

- `npm run build` and `npm test` (12 unit tests: file-import parsing/XSS-sanitization, and the five owner/edit/view/no-access/missing-document permission cases) both pass.
- Manual `curl`-driven API testing covering every permission boundary described above, including a deliberate XSS-in-upload attempt (`<script>`/`onerror=`) to confirm DOMPurify actually strips it rather than trusting the library by assumption.
- A real browser pass (headless Chromium via Playwright) through the full user journey — login, document list, opening a doc, editing, watching the autosave indicator, opening the share dialog — with a check for zero console errors, plus visual review of the resulting screenshots.
