import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import { redirect } from "next/navigation";
import { getShippingCompanies } from "@/features/shipping-companies/_lib/data-access";
import { ShippingCompaniesView } from "@/features/shipping-companies/_components/shipping-companies-view";

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
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const perms = session.user.permissionKeys ?? [];
    const resourcePath = "/api/shipping-companies";
    const authorized = isAuthorized(resourcePath, perms);

    // !isLoading && allowed is checked in Client component using usePermission which checks session permissions on client.
    // We should enforce basic access on server.
    if (!authorized) {
        // similar to companies, we can return error UI or let Client handle it.
        // But typically for pages we want to redirect or show error.
        // The original page showed <Alert> if !canView.
        const canView = isAuthorized(resourcePath, perms); // Re-check strictly?
        // Actually isAuthorized returns true if path matches permissions.

        if (!canView) {
            return (
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทขนส่ง</span>
                    </div>
                </div>
            );
        }
    }

    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(params.perPage || "12", 10)));
    const q = (params.q || "").trim();

    const parseDate = (value: string | undefined): Date | undefined => {
        if (!value) return undefined;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    const from = parseDate(params.from);
    const to = parseDate(params.to);

    const { total, shippingCompanies } = await getShippingCompanies({
        page,
        perPage,
        q,
        from,
        to
    });

    const serializedShippingCompanies = shippingCompanies.map(c => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(), // if exists in type
        deletedAt: c.deletedAt?.toISOString(), // if exists in type
        // Handle nested arrays?
        // The type ShippingCompanyRecord has customerList which is array of {id, name, customerCode}.
        // These should be serializable as they are plain objects.
    }));

    return (
        <ShippingCompaniesView
            initialShippingCompanies={serializedShippingCompanies}
            total={total}
            initialPage={page}
            initialPerPage={perPage}
            initialQ={q}
            initialDateRange={from || to ? { from, to } : undefined}
        />
    );
}
