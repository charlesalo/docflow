import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentAccess } from "@/lib/access";
import { SiteHeader } from "@/components/SiteHeader";
import { DocumentEditor } from "@/components/DocumentEditor";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { document, access } = await getDocumentAccess(id, user.id);

  if (!document || access === "none") {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <SiteHeader user={user} />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Document not found</h1>
          <p className="text-sm text-zinc-500">
            It may have been deleted, or you don&apos;t have access to it.
          </p>
          <Link href="/documents" className="text-sm font-medium text-zinc-900 underline">
            Back to my documents
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <DocumentEditor
          documentId={document.id}
          initialTitle={document.title}
          initialContent={document.content}
          canEdit={access === "owner" || access === "edit"}
          isOwner={access === "owner"}
          owner={document.owner}
        />
      </main>
    </div>
  );
}
