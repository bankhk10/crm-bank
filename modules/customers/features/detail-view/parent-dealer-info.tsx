"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CustomerRecord } from "../../types";

export function ParentDealerInfo({
    parentDealerId,
    dealerId,
}: {
    parentDealerId?: string | null;
    dealerId?: string | null;
}) {
    const [parent, setParent] = React.useState<CustomerRecord | null>(null);
    const [children, setChildren] = React.useState<CustomerRecord[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;
        setError(null);

        const fetchData = async () => {
            setLoading(true);
            try {
                if (dealerId) {
                    // Fetch sub-dealers (children)
                    const res = await fetch(
                        `/api/customers?parentDealerId=${encodeURIComponent(dealerId)}`
                    );
                    if (!res.ok) throw new Error("Failed to fetch sub-dealers");
                    const json = await res.json();
                    const list = Array.isArray(json)
                        ? json
                        : json?.customers ?? json?.data ?? json?.items ?? [];
                    if (mounted) setChildren(list);
                } else if (parentDealerId) {
                    // Fetch parent dealer
                    const res = await fetch(`/api/customers/${parentDealerId}`);
                    if (!res.ok) throw new Error("Failed to fetch parent dealer");
                    const json = await res.json();
                    const p = json?.customer ?? json;
                    if (mounted) setParent(p);
                }
            } catch (err: any) {
                if (mounted) setError(err?.message || "Error fetching data");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (dealerId || parentDealerId) {
            fetchData();
        }

        return () => {
            mounted = false;
        };
    }, [parentDealerId, dealerId]);

    if (loading) return <div className="text-sm">กำลังโหลดข้อมูล...</div>;
    if (error)
        return (
            <div className="text-sm text-red-600">ไม่สามารถโหลดข้อมูล: {error}</div>
        );

    // Show children when dealerId present (main dealer)
    if (dealerId) {
        if (!children || children.length === 0) {
            return <div className="text-sm">ยังไม่มีร้านรองภายใต้ร้านหลักนี้</div>;
        }

        return (
            <div className="space-y-3">
                {children.map((child) => (
                    <div
                        key={child.id}
                        className="flex items-center justify-between rounded-md border p-3 bg-white"
                    >
                        <div className="flex items-center gap-4">
                            <div className="font-medium">{child.name ?? "-"}</div>
                            <div className="text-sm text-muted-foreground">
                                {child.email ?? "-"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {child.phone ?? "-"}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/customers/${child.id}`}>
                                <Button size="icon-sm" variant="outline">
                                    <Eye className="size-4" />
                                </Button>
                            </Link>
                            <Link href={`/customers/${child.id}/edit`}>
                                <Button size="icon-sm" variant="outline">
                                    <Edit className="size-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Show parent dealer info
    if (!parentDealerId)
        return <div className="text-sm">ไม่มีข้อมูลร้านหลัก</div>;
    if (!parent) return <div className="text-sm">ไม่พบข้อมูลร้านหลัก</div>;

    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
                <div className="text-xs text-muted-foreground">ร้านหลัก</div>
                <div className="font-medium">{parent.name ?? "-"}</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">อีเมล</div>
                <div className="font-medium">{parent.email ?? "-"}</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">โทร</div>
                <div className="font-medium">{parent.phone ?? "-"}</div>
            </div>
        </div>
    );
}
