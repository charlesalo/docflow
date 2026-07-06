import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: { id: true, name: true, username: true },
    orderBy: { username: "asc" },
  });

  return NextResponse.json({ users });
}
