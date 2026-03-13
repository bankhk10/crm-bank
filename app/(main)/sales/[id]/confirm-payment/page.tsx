import { use } from "react";
import { SaleConfirmPaymentView } from "@/modules/sales";

export default function ConfirmPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <SaleConfirmPaymentView id={id} />;
}
