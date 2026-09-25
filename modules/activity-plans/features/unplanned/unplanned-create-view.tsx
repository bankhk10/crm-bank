"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UnplannedForm } from "./components/unplanned-form";
import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";

export default function UnplannedCreateView() {
  const { data: session, status: sessionStatus } = useSession();
  const { hasPermission, isLoading: permLoading } = usePermission(
    "menu.activity_plans",
  );

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const roles = (session?.user as any)?.roles ?? [];
  const isAdmin =
    roles.includes("administrator") ||
    roles.includes("admin") ||
    roles.includes("ceo") ||
    (session?.user as any)?.role === "administrator" ||
    (session?.user as any)?.role === "ADMIN";

  const canCreate =
    isAdmin ||
    hasPermission("activity.create") ||
    hasPermission("activity.manage");

  useEffect(() => {
    let isMounted = true;
    async function loadMasterData() {
      try {
        setLoadingData(true);
        const [custRes, prodRes] = await Promise.all([
          getCustomersAction({ perPage: 1000 }),
          listProductsAction({ status: "ACTIVE", perPage: 1000 }),
        ]);

        if (isMounted) {
          if (custRes?.success && custRes?.customers) {
            setCustomers(custRes.customers);
          } else if (custRes?.customers) {
            setCustomers(custRes.customers);
          }

          if (prodRes?.success && prodRes?.data) {
            setProducts(prodRes.data);
          } else if (prodRes?.products) {
            setProducts(prodRes.products);
          }
        }
      } catch (err: any) {
        console.error("Failed to load master data for unplanned form:", err);
        if (isMounted) {
          setLoadError("เกิดข้อผิดพลาดในการโหลดข้อมูลลูกค้าและสินค้า");
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    loadMasterData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (sessionStatus === "loading" || permLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">
          กำลังเตรียมแบบฟอร์มบันทึกกิจกรรมนอกแผน...
        </p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          ไม่มีสิทธิ์สร้างกิจกรรมนอกแผนงาน
        </h2>
        <p className="text-sm text-slate-600">
          คุณไม่มีสิทธิ์ในการสร้างกิจกรรมนอกแผนงานในระบบ (ต้องการสิทธิ์
          activity.create)
        </p>
        <div className="pt-2">
          <Link href="/activity-plans">
            <Button variant="outline" className="border-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้ารายการ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-amber-200 rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-slate-600">{loadError}</p>
        <div className="pt-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-slate-300"
          >
            ลองใหม่อีกครั้ง
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50/50 min-h-screen">
      <UnplannedForm customers={customers} products={products} />
    </div>
  );
}
