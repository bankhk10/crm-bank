import { use } from "react";
import { SaleEditView } from "@/modules/sales";

export default function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <SaleEditView id={id} />;
}
