import { use } from "react";
import { SaleApproveView } from "@/modules/sales/features/approve-view/sale-approve-view";

export default function ApproveSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <SaleApproveView id={id} />;
}
