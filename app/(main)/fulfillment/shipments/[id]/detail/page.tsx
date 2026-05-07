import { use } from "react";
import { ShipmentDetailView } from "@/modules/fulfillment/features/detail-view/shipment-detail-view";

export default function ShipmentDetailMobilePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ saleId?: string }>;
}) {
    const { id } = use(params);
    const { saleId } = use(searchParams);

    return <ShipmentDetailView id={id} saleId={saleId} />;
}
