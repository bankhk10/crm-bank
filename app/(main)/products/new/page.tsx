"use client";

import { ProductForm, createProductAction } from "@/modules/products";
import { Card } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";

export default function NewProductPage() {
  const { isLoading } = usePermission("product.create");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
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
