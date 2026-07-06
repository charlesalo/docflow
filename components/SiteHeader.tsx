import Link from "next/link";

export function SiteHeader({ user }: { user: { name: string; username: string } }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/documents" className="text-sm font-semibold text-zinc-900">
          Ajaia Docs
        </Link>
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span>
            Signed in as <span className="font-medium text-zinc-900">{user.name}</span>{" "}
            <span className="text-zinc-400">@{user.username}</span>
          </span>
          <Link href="/login" className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50">
            Switch user
          </Link>
        </div>
      </div>
    </header>
  );
}
