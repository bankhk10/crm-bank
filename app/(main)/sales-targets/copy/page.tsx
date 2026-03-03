"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SalesTargetForm } from "@/modules/sales-targets";
import { getSalesTargetAction } from "@/modules/sales-targets/server/actions";

export default function CopySalesTargetPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sourceId = searchParams.get("from");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copyData, setCopyData] = useState<any | null>(null);

    useEffect(() => {
        if (!sourceId) {
            // No source — just open blank create form
            setLoading(false);
            return;
        }

        const fetchSource = async () => {
            try {
                const result = await getSalesTargetAction(sourceId);
                if (result.success && "salesTarget" in result) {
                    // Strip the id so SalesTargetForm treats it as a new record
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id, createdAt, updatedAt, createdById, ...rest } =
                        result.salesTarget as any;
                    setCopyData(rest);
                } else {
                    setError(result.error || "ไม่พบข้อมูลที่ต้องการคัดลอก");
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        };

        fetchSource();
    }, [sourceId]);

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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-8 text-center max-w-md">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mx-auto mb-4">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-800 mb-2">{error}</h1>
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

    return <SalesTargetForm mode="copy" initialData={copyData} />;
}
