import { ShippingCompanyDetailPageView } from "@/modules/shipping-companies";

interface PageProps {
    params: Promise<{ shippingCompanyId: string }>;
}

export default async function ShippingCompanyDetailPage({ params }: PageProps) {
    const { shippingCompanyId } = await params;
    return <ShippingCompanyDetailPageView shippingCompanyId={shippingCompanyId} />;
}
