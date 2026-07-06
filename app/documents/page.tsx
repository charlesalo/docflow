import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DocumentsBoard } from "@/components/DocumentsBoard";
import { SiteHeader } from "@/components/SiteHeader";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      include: {
        owner: { select: { name: true, username: true } },
        shares: { where: { userId: user.id }, select: { permission: true } },
      },
    }),
  ]);

  const sharedWithMe = shared.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    owner: doc.owner,
    permission: doc.shares[0]?.permission ?? "view",
  }));

  const ownedDocs = owned.map((doc) => ({
    id: doc.id,
    title: doc.title,
    updatedAt: doc.updatedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <DocumentsBoard initialOwned={ownedDocs} initialShared={sharedWithMe} />
      </main>
    </div>
  );
}
