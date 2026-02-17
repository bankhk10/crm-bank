import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import { redirect } from "next/navigation";
import { getShippingCompany } from "@/features/shipping-companies/_lib/data-access";
import { ShippingCompanyDetailView } from "@/features/shipping-companies/_components/shipping-company-detail-view";
import type { ShippingCompanyRecord } from "@/features/shipping-companies/_types";

interface PageProps {
    params: Promise<{ shippingCompanyId: string }>;
}

export default async function ShippingCompanyDetailPage({ params }: PageProps) {
    const { shippingCompanyId } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const perms = session.user.permissionKeys ?? [];
    const resourcePath = "/api/shipping-companies";
    const authorized = isAuthorized(resourcePath, perms);

    // Enforce server-side permission check
    const canView = isAuthorized(resourcePath, perms);

    if (!canView) {
        return (
            <div className="container max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">คุณไม่มีสิทธิ์เปิดดูข้อมูลบริษัทขนส่งนี้</span>
                </div>
            </div>
        );
    }

    const shippingCompany = await getShippingCompany(shippingCompanyId);

    if (!shippingCompany) {
        return (
            <div className="container max-w-4xl mx-auto p-6 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">ไม่พบข้อมูล</strong>
                    <span className="block sm:inline"> ไม่พบข้อมูลบริษัทขนส่งที่คุณค้นหา</span>
                </div>
            </div>
        );
    }

    // Serialize dates and ensure type safety
    const serializedShippingCompany: ShippingCompanyRecord = {
        ...shippingCompany,
        createdAt: shippingCompany.createdAt?.toISOString() ?? undefined,
        customerList: shippingCompany.customerList.map(c => ({
            id: c.id,
            name: c.name,
            customerCode: c.customerCode
        }))
    };

    return <ShippingCompanyDetailView shippingCompany={serializedShippingCompany} />;
}
