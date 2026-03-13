"use client";

import React from "react";
import { ProductForm, createProductAction } from "@/modules/products";
import { Card } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProductNewView() {
  const router = useRouter();
  const { hasPermission, isLoading } = usePermission("product.create");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์ในการสร้างสินค้าใหม่</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6">
      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">
              เพิ่มสินค้าใหม่
            </h5>
          </div>
          <ProductForm
            onSubmit={async (payload) => {
              const result = await createProductAction(payload);
              if (result.success) {
                toast.success("สร้างสินค้าใหม่เรียบร้อยแล้ว");
                router.push("/products");
              }
              return {
                success: result.success,
                error: result.error,
                data: result.success ? { product: (result as any).product } : undefined,
              };
            }}
          />
        </div>
      </Card>
    </section>
  );
}
