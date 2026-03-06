"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SalesTargetForm } from "@/modules/sales-targets/features/form/sales-target-form";
import { getSalesTargetAction } from "@/modules/sales-targets/server/actions";

function CopyPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const fromId = searchParams.get("from");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!fromId) {
                toast.error("ไม่ระบุข้อมูลต้นทาง");
                router.push("/sales-targets");
                return;
            }
            const result = await getSalesTargetAction(fromId);
            if (result.success && "salesTarget" in result) {
                setData(result.salesTarget);
            } else {
                toast.error("ไม่พบข้อมูลต้นทาง");
                router.push("/sales-targets");
            }
            setLoading(false);
        }
        load();
    }, [fromId, router]);

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

    return <SalesTargetForm mode="copy" initialData={data} />;
}

export default function CopySalesTargetPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50/30">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-slate-600">กำลังโหลด...</p>
                </div>
            </div>
        }>
            <CopyPageContent />
        </Suspense>
    );
}
