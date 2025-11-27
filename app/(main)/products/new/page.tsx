"use client";

import React from "react";
import ProductForm from "@/components/features/products/product-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";

export default function NewProductPage() {
  const { allowed, isLoading } = usePermission("product.create");
  const canCreate = !isLoading && allowed;
  const permissionHint = "จำเป็นต้องมีสิทธิ์ product.create เพื่อสร้างสินค้าใหม่";

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
      {!canCreate ? (
        <Alert variant="destructive">
          <AlertDescription>{permissionHint}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <div className="p-6">
          <div className="text-center">
            <h5 className="font-semibold text-3xl border-b pb-6">เพิ่มสินค้าใหม่</h5>
          </div>

          <ProductForm />
        </div>
      </Card>
    </section>
  );
}
