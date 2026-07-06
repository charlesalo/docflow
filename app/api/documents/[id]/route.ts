import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";
import { updateDocumentSchema } from "@/lib/validation";
import DOMPurify from "isomorphic-dompurify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ document, access });
}

export async function PATCH(request: NextRequest, { params }: Params) {
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

  const body = await request.json().catch(() => null);
  const parsed = updateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.content !== undefined ? { content: DOMPurify.sanitize(parsed.data.content) } : {}),
    },
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access !== "owner") {
    return NextResponse.json({ error: "Only the owner can delete this document" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
