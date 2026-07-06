import { prisma } from "@/lib/prisma";
import { shouldCreateSnapshot } from "@/lib/versions";

// Called right after a PATCH applies an edit — snapshots the document's
// resulting (post-edit) state if enough time has passed since the last
// checkpoint, so each version reflects real authored content rather than
// whatever was there a moment before. Throttled so continuous autosave
// doesn't create a version per keystroke pause.
export async function maybeAutoSnapshot(documentId: string) {
  const [document, lastVersion] = await Promise.all([
    prisma.document.findUnique({ where: { id: documentId } }),
    prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  if (!document) return;

  if (shouldCreateSnapshot(lastVersion?.createdAt ?? null, new Date())) {
    await prisma.documentVersion.create({
      data: { documentId, title: document.title, content: document.content },
    });
  }
}

// Called for an explicit "Save version now" action — always snapshots the
// document's current state regardless of the throttle window.
export async function forceSnapshot(documentId: string) {
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return null;
  return prisma.documentVersion.create({
    data: { documentId, title: document.title, content: document.content },
  });
}
