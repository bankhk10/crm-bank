"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SaleForm } from "@/components/features/sales/sale-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermission } from "@/hooks/use-permission";
import type { SaleFormData } from "@/types/sales";

export default function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { hasPermission, allowed, isLoading } = usePermission("sale.edit");

  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch sale");
        return res.json();
      })
      .then((data) => {
        const sale = data.sale;
        
        // Convert to form data format
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
          billingAddress: sale.billingAddress || "",
          shippingAddress: sale.shippingAddress || "",
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
    const res = await fetch(`/api/sales/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update sale");
    }

    // Redirect to sale detail page
    router.push(`/sales/${id}`);
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
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">แก้ไขรายการขาย</h1>
        <p className="text-gray-500 mt-2">แก้ไขข้อมูลรายการขายสินค้า</p>
      </div>

      <SaleForm initialData={initialData} onSubmit={handleSubmit} isEdit />
    </div>
  );
}
