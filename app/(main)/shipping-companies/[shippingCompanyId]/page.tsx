import React from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { isAuthorized } from "@/modules/rbac";
import { redirect } from "next/navigation";
import { getShippingCompanyDetailUseCase } from "@/modules/shipping-companies/application";
import { ShippingCompanyDetailView } from "@/modules/shipping-companies/features/detail-view/shipping-company-detail-view";
import type { ShippingCompanyRecord } from "@/modules/shipping-companies/types";

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

    const result = await getShippingCompanyDetailUseCase(shippingCompanyId);

    if (!result.success || !('shippingCompany' in result)) {
        return (
            <div className="container max-w-4xl mx-auto p-6 text-center">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">ไม่พบข้อมูล</strong>
                    <span className="block sm:inline"> ไม่พบข้อมูลบริษัทขนส่งที่คุณค้นหา</span>
                </div>
            </div>
        );
    }

    const sc = result.shippingCompany;

    // Serialize dates and ensure type safety
    const serializedShippingCompany: ShippingCompanyRecord = {
        ...sc,
        createdAt: sc.createdAt?.toISOString() ?? undefined,
        customerList: sc.customerList.map(c => ({
            id: c.id,
            name: c.name,
            customerCode: c.customerCode
        }))
    };

    return <ShippingCompanyDetailView shippingCompany={serializedShippingCompany} />;
}

