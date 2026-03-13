import { ShippingCompanyEditPageView } from "@/modules/shipping-companies";

interface PageProps {
    params: Promise<{ shippingCompanyId: string }>;
}

export default async function EditShippingCompanyPage({ params }: PageProps) {
    const { shippingCompanyId } = await params;
    return <ShippingCompanyEditPageView shippingCompanyId={shippingCompanyId} />;
}
