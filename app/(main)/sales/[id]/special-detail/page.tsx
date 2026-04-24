import { use } from "react";
import { SaleDetailView } from "@/modules/sales/features/detail-view/sale-detail-view";

export default function SpecialSaleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return <SaleDetailView id={id} type="special" />;
}
