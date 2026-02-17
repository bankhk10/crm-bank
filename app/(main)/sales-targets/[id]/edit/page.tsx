"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Target } from "lucide-react";
import { SalesTargetForm } from "@/features/sales-targets";

export default function EditSalesTargetPage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<any | null>(null);

  useEffect(() => {
    const fetchTarget = async () => {
      try {
        const res = await fetch(`/api/sales-targets?id=${params.id}`);
        if (!res.ok) {
          throw new Error("ไม่พบข้อมูลเป้าหมายการขาย");
        }
        const data = await res.json();
        setTarget(data.detailedTarget);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchTarget();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8 text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mx-auto mb-4">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">
            {error || "ไม่พบข้อมูลเป้าหมายการขาย"}
          </h1>
          <p className="text-slate-500 mb-6">
            โปรดลองใหม่อีกครั้งหรือกลับไปยังหน้ารายการเป้าหมาย
          </p>
          <Link href="/sales-targets">
            <Button className="rounded-xl px-6">กลับไปยังรายการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <SalesTargetForm mode="edit" initialData={target} />;
}
