import { prisma } from "@/lib/prisma";

export type AccessLevel = "owner" | "edit" | "view" | "none";

export async function getDocumentAccess(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, username: true } },
      shares: {
        include: { user: { select: { id: true, name: true, username: true } } },
      },
    },
  });

  if (!document) return { document: null, access: "none" as AccessLevel };

  if (document.ownerId === userId) {
    return { document, access: "owner" as AccessLevel };
  }

  const share = document.shares.find((s) => s.userId === userId);
  if (share) {
    return { document, access: (share.permission as AccessLevel) ?? "view" };
  }

  return { document, access: "none" as AccessLevel };
}
