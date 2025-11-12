import Link from "next/link";
import CompaniesKanbanBoard from "@/components/features/companies/companies-kanban-board";
import { auth } from "@/lib/auth";

export default async function CompaniesPage() {
  const session = await auth();
  const canCreate = session?.user.role === "ADMIN";

  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">Overview of client organizations and accounts.</p>
        </div>
        {canCreate ? (
          <Link
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            href="/companies/new"
          >
            Add company
          </Link>
        ) : null}
      </header>
      <CompaniesKanbanBoard />
    </section>
  );
}
