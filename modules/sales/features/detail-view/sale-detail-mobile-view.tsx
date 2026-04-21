"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
    ArrowLeft,
    AlertTriangle,
    Loader2,
    FileText,
    BadgeDollarSign,
    User,
    Phone,
    MapPin,
    Package,
    ClipboardList,
    CreditCard,
    Calendar,
    Truck,
    CheckCircle,
    Edit,
    ExternalLink,
    Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePermission } from "@/hooks/use-permission";
import type { SaleDetailResponse, SaleWithRelations } from "@/modules/sales/types";
import {
    SaleStatusLabels,
    PaymentTermLabels,
    getSaleStatusColor,
    getSaleStatusDotColor,
} from "@/modules/sales/types";
import { getSaleAction } from "../../server/actions";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTHB(amount: number) {
    return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatThaiDate(value: Date | string | null | undefined) {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    const year = date.getFullYear() + 543;
    return format(date, `dd MMM ${year}`, { locale: th });
}

function formatThaiDateTime(value: Date | string | null | undefined) {
    if (!value) return "-";
    const date = typeof value === "string" ? new Date(value) : value;
    const year = date.getFullYear() + 543;
    return format(date, `dd MMM ${year} HH:mm น.`, { locale: th });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoRow({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: React.ReactNode;
    icon?: React.ElementType;
}) {
    return (
        <div className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0 mt-0.5">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
            </span>
            <span className="text-sm font-medium text-slate-800 text-right break-words max-w-[65%]">
                {value || "-"}
            </span>
        </div>
    );
}

function SectionCard({
    title,
    icon: Icon,
    children,
    accentColor = "blue",
}: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    accentColor?: "blue" | "purple" | "emerald" | "amber" | "slate";
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 ring-blue-100",
        purple: "bg-purple-50 text-purple-600 ring-purple-100",
        emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
        amber: "bg-amber-50 text-amber-600 ring-amber-100",
        slate: "bg-slate-50 text-slate-600 ring-slate-100",
    };

    return (
        <Card className="border border-slate-200/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <CardTitle className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
                    <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ring-1 ${colors[accentColor]}`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                    </span>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-1 pb-3">{children}</CardContent>
        </Card>
    );
}

function ProductItemCard({
    item,
    index,
}: {
    item: SaleWithRelations["items"][number];
    index: number;
}) {
    const subtotal = Number(item.unitPrice) * Number(item.quantity);
    return (
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 space-y-2">
            <div className="flex items-start gap-2.5">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold mt-0.5">
                    {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {item.product?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        รหัส: {item.product?.productCode}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pl-8">
                <div className="text-center bg-white rounded-md p-1.5 border border-slate-100">
                    <p className="text-xs text-slate-400">จำนวน</p>
                    <p className="text-sm font-bold text-slate-700">
                        {Number(item.quantity).toLocaleString("th-TH")}
                    </p>
                    <p className="text-xs text-slate-400">{item.product?.unit || "หน่วย"}</p>
                </div>
                <div className="text-center bg-white rounded-md p-1.5 border border-slate-100">
                    <p className="text-xs text-slate-400">ราคา/หน่วย</p>
                    <p className="text-sm font-bold text-slate-700">
                        {formatTHB(Number(item.unitPrice))}
                    </p>
                </div>
                <div className="text-center bg-blue-50 rounded-md p-1.5 border border-blue-100">
                    <p className="text-xs text-blue-500">รวม</p>
                    <p className="text-sm font-bold text-blue-700">{formatTHB(subtotal)}</p>
                </div>
            </div>
        </div>
    );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="h-9 w-24 bg-slate-200 animate-pulse rounded-lg" />
                <div className="h-6 w-28 bg-slate-200 animate-pulse rounded-full" />
            </div>
            <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-32 bg-slate-200 animate-pulse rounded-xl"
                        style={{ animationDelay: `${i * 100}ms` }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SaleDetailMobileView({ id }: { id: string }) {
    const router = useRouter();
    const { hasPermission } = usePermission("menu.sales");
    const canViewPdf = hasPermission("sale.view");

    const [data, setData] = useState<SaleDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getSaleAction(id)
            .then((res: any) => {
                if (!res.success || !("sale" in res))
                    throw new Error(res.error || "ไม่พบข้อมูลรายการขาย");
                setData(res);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <LoadingSkeleton />;

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-6">
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
                    <AlertDescription>{error || "ไม่พบข้อมูลรายการขาย"}</AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    ย้อนกลับ
                </Button>
            </div>
        );
    }

    const { sale, stockWarnings, priceWarnings } = data;

    const subtotal = sale.items.reduce(
        (acc, item) => acc + Number(item.unitPrice) * Number(item.quantity),
        0
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-10">
            {/* ─── Sticky Top Bar ── */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-slate-600 hover:text-slate-900 -ml-2"
                        asChild
                    >
                        <Link href="/sales">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm">ข้อมูลการขาย</span>
                        </Link>
                    </Button>

                    <Badge
                        className={`${getSaleStatusColor(sale.status)} border-none text-xs px-3 py-1`}
                    >
                        <span
                            className={`mr-1.5 h-2 w-2 rounded-full inline-block ${getSaleStatusDotColor(sale.status)}`}
                        />
                        {SaleStatusLabels[sale.status]}
                    </Badge>
                </div>
            </div>

            {/* ─── Hero Card ── */}
            <div className="px-4 pt-5 max-w-2xl mx-auto">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white p-5 shadow-lg mb-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-blue-200 text-xs font-medium mb-1">เลขที่ออเดอร์</p>
                            <h1 className="text-xl font-bold tracking-tight truncate">
                                {sale.saleNumber || "-"}
                            </h1>
                            {sale.saleOrderRef && (
                                <p className="text-blue-200 text-xs mt-1">
                                    คำสั่งขาย: {sale.saleOrderRef}
                                </p>
                            )}
                        </div>
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/30">
                            <BadgeDollarSign className="h-6 w-6 text-white" />
                        </span>
                    </div>

                    <Separator className="my-4 bg-white/20" />

                    <div className="flex items-baseline justify-between">
                        <span className="text-blue-200 text-sm">ยอดรวมสุทธิ</span>
                        <span className="text-2xl font-extrabold tracking-tight">
                            {formatTHB(Number(sale.totalAmount))}
                        </span>
                    </div>
                </div>

                {/* ─── Warnings ── */}
                {sale.status === "REJECTED" && (sale as any).rejectionReason && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>รายการนี้ไม่ได้รับการอนุมัติ</AlertTitle>
                        <AlertDescription>
                            <strong>เหตุผล:</strong> {(sale as any).rejectionReason}
                        </AlertDescription>
                    </Alert>
                )}

                {stockWarnings && stockWarnings.length > 0 && (
                    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <AlertTitle className="text-amber-700">แจ้งเตือนสต็อก</AlertTitle>
                        <AlertDescription>
                            {stockWarnings.map((w) => (
                                <p key={w.productId} className="text-xs">
                                    {w.productName}: ต้องการ {w.requested}, มี {w.available}
                                </p>
                            ))}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-4">
                    {/* ─── ข้อมูลออเดอร์ ── */}
                    <SectionCard title="ข้อมูลออเดอร์" icon={ClipboardList} accentColor="blue">
                        <InfoRow
                            label="วันที่ออเดอร์"
                            value={formatThaiDateTime(sale.saleDate)}
                            icon={Calendar}
                        />
                        <InfoRow
                            label="เงื่อนไขชำระ"
                            value={
                                PaymentTermLabels[sale.paymentTerm] || sale.paymentTerm
                            }
                            icon={CreditCard}
                        />
                        {sale.creditDays != null && (
                            <InfoRow
                                label="เครดิต (วัน)"
                                value={`${sale.creditDays} วัน`}
                                icon={Calendar}
                            />
                        )}
                        {sale.creditDueDate && (
                            <InfoRow
                                label="ครบกำหนดชำระ"
                                value={formatThaiDate(sale.creditDueDate)}
                                icon={Calendar}
                            />
                        )}
                        {sale.requestedDeliveryDate && (
                            <InfoRow
                                label="กำหนดส่ง (ร้องขอ)"
                                value={formatThaiDate(sale.requestedDeliveryDate)}
                                icon={Truck}
                            />
                        )}
                        {sale.deliveryDate && (
                            <InfoRow
                                label="วันจัดส่ง"
                                value={formatThaiDate(sale.deliveryDate)}
                                icon={Truck}
                            />
                        )}
                        <InfoRow
                            label="พนักงานขาย"
                            value={sale.employee?.name}
                            icon={User}
                        />
                        <InfoRow
                            label="สร้างโดย"
                            value={sale.createdBy?.name}
                            icon={User}
                        />
                        {sale.approvedBy && (
                            <InfoRow
                                label="อนุมัติโดย"
                                value={sale.approvedBy.name}
                                icon={CheckCircle}
                            />
                        )}
                    </SectionCard>

                    {/* ─── ข้อมูลลูกค้า ── */}
                    <SectionCard title="ข้อมูลลูกค้า" icon={User} accentColor="purple">
                        <InfoRow label="ชื่อลูกค้า" value={sale.customer?.name} />
                        <InfoRow
                            label="รหัสลูกค้า"
                            value={sale.customer?.customerCode}
                        />
                        {sale.customer?.phone && (
                            <InfoRow
                                label="เบอร์โทร"
                                value={sale.customer.phone}
                                icon={Phone}
                            />
                        )}
                        {(sale.customer?.addressLine ||
                            sale.customer?.province) && (
                            <InfoRow
                                label="ที่อยู่"
                                value={[
                                    sale.customer?.addressLine,
                                    sale.customer?.district,
                                    sale.customer?.province,
                                    sale.customer?.postalCode,
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                icon={MapPin}
                            />
                        )}
                    </SectionCard>

                    {/* ─── รายการสินค้า ── */}
                    <SectionCard title="รายการสินค้า" icon={Package} accentColor="emerald">
                        <div className="space-y-2 pt-2">
                            {sale.items.map((item, idx) => (
                                <ProductItemCard key={item.id} item={item} index={idx} />
                            ))}
                        </div>
                    </SectionCard>

                    {/* ─── สรุปยอด ── */}
                    <SectionCard title="สรุปยอดชำระ" icon={Receipt} accentColor="amber">
                        <InfoRow
                            label="ยอดสินค้ารวม"
                            value={formatTHB(subtotal)}
                        />
                        {Number(sale.shippingCost) > 0 && (
                            <InfoRow
                                label="ค่าขนส่ง"
                                value={formatTHB(Number(sale.shippingCost))}
                                icon={Truck}
                            />
                        )}
                        {Number(sale.otherCosts) > 0 && (
                            <InfoRow
                                label={sale.otherCostsDescription || "ค่าใช้จ่ายอื่น"}
                                value={formatTHB(Number(sale.otherCosts))}
                            />
                        )}
                        {sale.promotionalCreditUsed && Number(sale.promotionalCreditUsed) > 0 && (
                            <InfoRow
                                label="เครดิตส่งเสริมการขาย"
                                value={`- ${formatTHB(Number(sale.promotionalCreditUsed))}`}
                            />
                        )}
                        <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-dashed border-slate-200">
                            <span className="text-sm font-bold text-slate-700">ยอดรวมสุทธิ</span>
                            <span className="text-lg font-extrabold text-blue-700">
                                {formatTHB(Number(sale.totalAmount))}
                            </span>
                        </div>
                    </SectionCard>

                    {/* ─── หมายเหตุ ── */}
                    {sale.notes && (
                        <SectionCard title="หมายเหตุ" icon={FileText} accentColor="slate">
                            <p className="text-sm text-slate-600 pt-2 leading-relaxed whitespace-pre-wrap">
                                {sale.notes}
                            </p>
                        </SectionCard>
                    )}
                </div>

                {/* ─── Action Buttons ── */}
                <div className="mt-6 space-y-3">
                    {canViewPdf && (
                        <Button
                            asChild
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium"
                        >
                            <a
                                href={`/api/pdf?saleId=${sale.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                ดูเอกสาร PDF
                                <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
                            </a>
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        className="w-full h-11 border-slate-200 text-slate-700 font-medium"
                        asChild
                    >
                        <Link href="/sales">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            กลับหน้าข้อมูลการขาย
                        </Link>
                    </Button>
                </div>

                {/* ─── Timestamp ── */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    สร้างเมื่อ {formatThaiDateTime(sale.createdAt)}
                    {sale.updatedAt !== sale.createdAt && (
                        <> · แก้ไขล่าสุด {formatThaiDateTime(sale.updatedAt)}</>
                    )}
                </p>
            </div>
        </div>
    );
}
