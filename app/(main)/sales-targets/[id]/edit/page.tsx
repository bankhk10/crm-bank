"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SalesTargetForm } from "@/modules/sales-targets/features/form/sales-target-form";
import { getSalesTargetAction } from "@/modules/sales-targets/server/actions";

export default function EditSalesTargetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getSalesTargetAction(id);
      if (result.success && "salesTarget" in result) {
        setData(result.salesTarget);
      } else {
        toast.error("ไม่พบข้อมูลเป้าหมาย");
        router.push("/sales-targets");
      }
      setLoading(false);
    }
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return <SalesTargetForm mode="edit" initialData={data} />;
}
