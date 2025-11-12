import Link from "next/link";
import EmployeeTable from "@/components/features/employee/employee-table";

export default function EmployeePage() {
  return (
    <section className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">Manage team members and assignments.</p>
        </div>
        <Link
          className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          href="/employee/new"
        >
          Add employee
        </Link>
      </header>
      <EmployeeTable />
    </section>
  );
}
