import React from "react";
import { auth } from "@/modules/auth/infrastructure/next-auth";
import { redirect } from "next/navigation";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { getShippingCompanyDetailUseCase } from "@/modules/shipping-companies/application";
import { ShippingCompanyEditView } from "@/modules/shipping-companies/features/form/shipping-company-edit-view";

interface PageProps {
    params: Promise<{ shippingCompanyId: string }>;
}

export default async function EditShippingCompanyPage({ params }: PageProps) {
    const { shippingCompanyId } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const perms = session.user.permissionKeys ?? [];
    const canEdit =
        perms.includes("shipping-company.edit") ||
        perms.includes("shipping-company.manage") ||
        perms.includes("menu.shipping-companies"); // fallback

    if (!canEdit) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">คุณไม่มีสิทธิ์แก้ไขบริษัทขนส่งนี้</span>
                </div>
            </div>
        );
    }

    const result = await getShippingCompanyDetailUseCase(shippingCompanyId);

    if (!result.success || !('shippingCompany' in result)) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">ไม่พบข้อมูล</strong>
                    <span className="block sm:inline"> ไม่พบข้อมูลบริษัทขนส่งที่คุณค้นหา</span>
                </div>
            </div>
        );
    }

    const shippingCompany = result.shippingCompany;

    const customersRes = await getCustomersAction({ perPage: 1000 });
    const customers = customersRes.customers || [];
    const customerOptions = customers.map((c: any) => ({
        value: c.id,
        label: `${c.customerCode} - ${c.name}`
    }));

    const initialData = {
        name: shippingCompany.name,
        phone: shippingCompany.phone ?? undefined,
        address: shippingCompany.address ?? undefined,
        addressLine: shippingCompany.addressLine ?? undefined,
        province: shippingCompany.province ?? undefined,
        district: shippingCompany.district ?? undefined,
        subdistrict: shippingCompany.subdistrict ?? undefined,
        postalCode: shippingCompany.postalCode ?? undefined,
        notes: shippingCompany.notes ?? undefined,
        status: shippingCompany.status ?? "ACTIVE",
        customerIds: shippingCompany.customerList.map(c => c.id),
    };

    return (
        <ShippingCompanyEditView
            shippingCompanyId={shippingCompanyId}
            initialData={initialData}
            customerOptions={customerOptions}
            canEdit={canEdit}
        />
    );
}

