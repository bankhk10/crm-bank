"use client";

import Link from "next/link";
import CompaniesKanbanBoard from "@/components/features/companies/companies-kanban-board";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CompaniesPage() {
  const { hasPermission, allowed, isLoading } = usePermission("menu.companies");
  const canCreate =
    hasPermission("companies.create") ||
    hasPermission("companies.manage") ||
    hasPermission("menu.companies");
  const canView = !isLoading && allowed;

  if (!canView) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัท</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
        ) : (
          <button
            type="button"
            className="rounded bg-emerald-600/50 px-3 py-2 text-sm font-semibold text-white"
            disabled
            title="จำเป็นต้องมีสิทธิ์ companies.create หรือ companies.manage"
          >
            Add company
          </button>
        )}
      </header>
      <CompaniesKanbanBoard />
    </section>
  );
}
