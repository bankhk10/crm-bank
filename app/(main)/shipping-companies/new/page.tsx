import React from "react";
import { auth } from "@/lib/auth";
import { isAuthorized } from "@/src/core/rbac";
import { redirect } from "next/navigation";
import { getCustomers } from "@/modules/customers/_lib/data-access";
import { ShippingCompanyNewView } from "@/modules/shipping-companies/_components/shipping-company-new-view";

export default async function NewShippingCompanyPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/api/auth/signin");
    }

    const perms = session.user.permissionKeys ?? [];
    const canCreate =
        perms.includes("shipping-company.create") ||
        perms.includes("shipping-company.manage") ||
        perms.includes("menu.shipping-companies");

    if (!canCreate) {
        // Basic check
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">คุณไม่มีสิทธิ์สร้างบริษัทขนส่งใหม่</span>
                </div>
            </div>
        );
    }

    const customers = await getCustomers({ take: 1000 });
    const customerOptions = customers.map(c => ({
        value: c.id,
        label: `${c.customerCode} - ${c.name}`
    }));

    return <ShippingCompanyNewView customerOptions={customerOptions} />;
}
