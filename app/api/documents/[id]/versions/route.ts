import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";
import { forceSnapshot } from "@/lib/versionSnapshot";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json({ versions });
}

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access === "view") {
    return NextResponse.json({ error: "You only have view access to this document" }, { status: 403 });
  }

  const version = await forceSnapshot(id);
  return NextResponse.json({ version }, { status: 201 });
}
