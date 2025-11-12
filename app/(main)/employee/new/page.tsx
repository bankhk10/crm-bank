import EmployeeForm from "@/components/features/employee/employee-form";

export default function NewEmployeePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">New employee</h1>
        <p className="text-sm text-muted-foreground">Create a new team member record.</p>
      </header>
      <EmployeeForm />
    </section>
  );
}
