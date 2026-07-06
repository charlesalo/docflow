import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({ orderBy: { username: "asc" } }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">Ajaia Docs</h1>
        <p className="mt-1 text-sm text-zinc-500">
          This is a mocked login for the assessment — pick a seeded account to continue. No password required.
        </p>
        <LoginForm users={users} currentUserId={currentUser?.id ?? null} />
      </div>
    </div>
  );
}
