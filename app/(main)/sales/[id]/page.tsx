import { use } from "react";
import { SaleDetailMobileView } from "@/modules/sales/features/detail-view/sale-detail-mobile-view";

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <SaleDetailMobileView id={id} />;
}
