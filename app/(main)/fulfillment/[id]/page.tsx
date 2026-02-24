import FulfillmentDetailPage from "@/modules/fulfillment/features/detail-view/fulfillment-detail-view";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
    return <FulfillmentDetailPage params={params} />;
}
