import { use } from "react";
import { EmployeeForecastView } from "@/modules/sales-forecast";

export default function EmployeeForecastPage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  const { employeeId } = use(params);

  return <EmployeeForecastView employeeId={employeeId} />;
}
