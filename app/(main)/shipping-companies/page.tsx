import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/modules/rbac";
import { redirect } from "next/navigation";
import { listShippingCompaniesUseCase } from "@/modules/shipping-companies/application";
import { ShippingCompaniesTable } from "@/modules/shipping-companies/features/list-view/shipping-companies-table";

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
    const canView = isAuthorized(resourcePath, perms);

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

    const { total, shippingCompanies } = await listShippingCompaniesUseCase({
        page,
        perPage,
        q,
        from,
        to
    });

    const serializedShippingCompanies = shippingCompanies.map(c => ({
        ...c,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
        deletedAt: c.deletedAt?.toISOString(),
    }));

    return (
        <ShippingCompaniesTable
            initialShippingCompanies={serializedShippingCompanies}
            total={total}
            initialPage={page}
            initialPerPage={perPage}
            initialQ={q}
            initialDateRange={from || to ? { from, to } : undefined}
        />
    );
}
