import EmployeeForm from "@/components/features/employee/employee-form";

interface EmployeeDetailPageProps {
  params: {
    employeeId: string;
  };
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Edit employee</h1>
        <p className="text-sm text-muted-foreground">Update details for employee #{params.employeeId}.</p>
      </header>
      <EmployeeForm employeeId={params.employeeId} />
    </section>
  );
}
