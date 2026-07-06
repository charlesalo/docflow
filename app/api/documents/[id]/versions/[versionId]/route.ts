import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id, versionId } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: id },
  });
  if (!version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  return NextResponse.json({ version });
}
