import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";
import { forceSnapshot } from "@/lib/versionSnapshot";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id, versionId } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access === "view") {
    return NextResponse.json({ error: "You only have view access to this document" }, { status: 403 });
  }

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: id },
  });
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  // Snapshot the current (pre-restore) state first so restoring is itself undoable.
  await forceSnapshot(id);

  const restored = await prisma.document.update({
    where: { id },
    data: { title: version.title, content: version.content },
  });

  return NextResponse.json({ document: restored });
}
