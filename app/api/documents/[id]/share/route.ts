import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";
import { shareDocumentSchema, revokeShareSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access !== "owner") {
    return NextResponse.json({ error: "Only the owner can share this document" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = shareDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!targetUser) {
    return NextResponse.json({ error: `No user found with username "${parsed.data.username}"` }, { status: 404 });
  }
  if (targetUser.id === document.ownerId) {
    return NextResponse.json({ error: "The owner already has access" }, { status: 400 });
  }

  const share = await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUser.id } },
    update: { permission: parsed.data.permission },
    create: { documentId: id, userId: targetUser.id, permission: parsed.data.permission },
    include: { user: { select: { id: true, name: true, username: true } } },
  });

  return NextResponse.json({ share }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);
  if (!document || access === "none") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (access !== "owner") {
    return NextResponse.json({ error: "Only the owner can modify sharing" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = revokeShareSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.share.deleteMany({ where: { documentId: id, userId: targetUser.id } });
  return NextResponse.json({ ok: true });
}
