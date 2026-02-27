"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SaleForm } from "@/modules/sales/features/form/sale-form";
import { updateSaleAction, getSaleAction } from "@/modules/sales/server/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleFormData } from "@/modules/sales/types";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { allowed, isLoading } = usePermission("sale.edit");

  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSaleAction(id)
      .then((res) => {
        if (!res.success || !("sale" in res)) throw new Error(res.error || "Failed to fetch sale");
        return res;
      })
      .then((data: any) => {
        const sale = data.sale;
        const useCustomShipping = sale.useCustomShipping ?? false;

        setInitialData({
          id: sale.id,
          customerId: sale.customerId,
          employeeId: sale.employeeId,
          paymentTerm: sale.paymentTerm,
          creditDays: sale.creditDays || 0,
          creditDueDate: sale.creditDueDate
            ? new Date(sale.creditDueDate).toISOString().split("T")[0]
            : "",
          usePromotionalCredit: sale.usePromotionalCredit,
          promotionalCreditUsed: sale.promotionalCreditUsed
            ? Number(sale.promotionalCreditUsed)
            : 0,
          saleDate: new Date(sale.saleDate).toISOString().split("T")[0],
          deliveryDate: sale.deliveryDate
            ? new Date(sale.deliveryDate).toISOString().split("T")[0]
            : "",
          requestedDeliveryDate: sale.requestedDeliveryDate
            ? new Date(sale.requestedDeliveryDate).toISOString().split("T")[0]
            : "",
          deliveryMethod: sale.deliveryMethod,
          pickupCompanyId: sale.pickupCompanyId,
          billingAddress: sale.billingAddress || "",
          shippingAddress: sale.saleAddress
            ? [
              sale.saleAddress.shipping_address_line,
              sale.saleAddress.shipping_subdistrict
                ? `ต.${sale.saleAddress.shipping_subdistrict}`
                : "",
              sale.saleAddress.shipping_district
                ? `อ.${sale.saleAddress.shipping_district}`
                : "",
              sale.saleAddress.shipping_province
                ? `จ.${sale.saleAddress.shipping_province}`
                : "",
              sale.saleAddress.shipping_postal_code,
            ]
              .filter(Boolean)
              .join(" ")
            : "",
          useCustomShipping, // Flag to indicate custom shipping was used
          selectedAddressId: sale.selectedAddressId || "",
          items: sale.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            originalPrice: Number(item.originalPrice),
            priceModified: item.priceModified,
          })),
          shippingCost: Number(sale.shippingCost),
          otherCosts: Number(sale.otherCosts),
          otherCostsDescription: sale.otherCostsDescription || "",
          notes: sale.notes || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (data: SaleFormData) => {
    const res = await updateSaleAction(id, data);

    if (!res.success) {
      throw new Error(res.error || "Failed to update sale");
    }

    toast.success("บันทึกการแก้ไขสำเร็จ");
    router.push(`/sales`);
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์แก้ไขรายการขาย</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <section className="space-y-6 container mx-auto py-8">
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">
              แก้ไขบันทึกการขาย ( Sales note )
            </h5>
          </div>
          <SaleForm
            initialData={initialData}
            onSubmit={handleSubmit}
            isEdit
          />
        </div>
      </Card>
    </section>
  );
}
