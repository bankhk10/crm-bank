"use client";

import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ProductCarousel } from "./components/product-carousel";

export default function EmployeeDashboardView() {
  const { hasPermission, isLoading } = usePermission("menu.show_product");

  if (!isLoading && !hasPermission) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            คุณไม่มีสิทธิ์เข้าถึงแดชบอร์ดพนักงาน
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-4 md:p-8 space-y-6 md:space-y-8 rounded-2xl">
      {/* Product Carousel */}
      <ProductCarousel />
    </div>
  );
}
