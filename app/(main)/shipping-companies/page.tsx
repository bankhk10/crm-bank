import { ShippingCompaniesListView } from "@/modules/shipping-companies";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        perPage?: string;
        q?: string;
        from?: string;
        to?: string;
    }>;
}

export default async function ShippingCompaniesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    return <ShippingCompaniesListView searchParams={params} />;
}
