"use client";

/**
 * SaleConfirmDialog Component
 * Displays a confirmation popup with a summary of sale form data before saving
 */

import React from "react";
import { CheckCircle2, X, Save, User, Package, CreditCard, Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import type { SaleFormProduct } from "../../../types";

// ---- Types ----

interface ConfirmSaleItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface SaleConfirmData {
    // Customer & Employee
    customerName: string;
    employeeName: string;
    // Payment
    paymentTermLabel: string;
    saleDate: string;
    requestedDeliveryDate?: string;
    // Delivery
    deliveryMethodLabel: string;
    shippingAddress: string;
    // Items
    items: ConfirmSaleItem[];
    products: SaleFormProduct[];
    // Totals
    subtotal: number;
    shippingCost: number;
    otherCosts: number;
    otherCostsDescription?: string;
    total: number;
    // Notes
    notes?: string;
}

interface SaleConfirmDialogProps {
    open: boolean;
    data: SaleConfirmData | null;
    loading: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

// ---- Helpers ----

function formatNumber(value: number): string {
    return value.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return "-";
    try {
        return new Date(dateStr).toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

// ---- Sub-components ----

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between items-start gap-2 py-1.5">
            <span className="text-sm text-gray-500 shrink-0 min-w-[130px]">{label}</span>
            <span className="text-sm font-medium text-gray-800 text-right">{value || "-"}</span>
        </div>
    );
}

function SectionCard({
    icon,
    title,
    children,
    accent,
}: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    accent?: string;
}) {
    return (
        <div className={`rounded-xl border bg-white divide-y divide-gray-100 overflow-hidden shadow-sm ${accent ? `border-l-4 ${accent}` : "border-gray-200"}`}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50">
                <span className="text-gray-400">{icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
            </div>
            <div className="px-4 py-1 divide-y divide-gray-50">{children}</div>
        </div>
    );
}

// ---- Main Component ----

export function SaleConfirmDialog({
    open,
    data,
    loading,
    onConfirm,
    onClose,
}: SaleConfirmDialogProps) {
    if (!data) return null;

    const getProductName = (productId: string) => {
        const product = data.products.find((p) => p.id === productId);
        return product ? `${product.name}${product.unit ? ` (${product.unit})` : ""}` : productId;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                {/* Header */}
                <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-green-600 to-emerald-500 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 rounded-full p-2">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-white text-lg font-bold">
                                ยืนยันการบันทึกข้อมูล
                            </DialogTitle>
                            <p className="text-green-100 text-sm mt-0.5">
                                กรุณาตรวจสอบข้อมูลด้านล่างก่อนยืนยัน
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 bg-gray-50">
                    {/* Customer & Employee */}
                    <SectionCard
                        icon={<User className="h-4 w-4" />}
                        title="ลูกค้าและพนักงาน"
                        accent="border-l-blue-500"
                    >
                        <InfoRow label="ลูกค้า" value={data.customerName} />
                        <InfoRow label="พนักงานขาย" value={data.employeeName} />
                    </SectionCard>

                    {/* Payment & Dates */}
                    <SectionCard
                        icon={<CreditCard className="h-4 w-4" />}
                        title="เงื่อนไขและวันที่"
                        accent="border-l-purple-500"
                    >
                        <InfoRow label="เงื่อนไขชำระเงิน" value={data.paymentTermLabel} />
                        <InfoRow label="วันที่ออเดอร์" value={formatDate(data.saleDate)} />
                        {data.requestedDeliveryDate && (
                            <InfoRow
                                label="วันที่ต้องการของ"
                                value={formatDate(data.requestedDeliveryDate)}
                            />
                        )}
                    </SectionCard>

                    {/* Delivery */}
                    <SectionCard
                        icon={<Truck className="h-4 w-4" />}
                        title="การจัดส่ง"
                        accent="border-l-orange-500"
                    >
                        <InfoRow label="วิธีจัดส่ง" value={data.deliveryMethodLabel} />
                        <InfoRow label="ที่อยู่จัดส่ง" value={data.shippingAddress} />
                    </SectionCard>

                    {/* Items */}
                    <SectionCard
                        icon={<Package className="h-4 w-4" />}
                        title={`รายการสินค้า (${data.items.length} รายการ)`}
                        accent="border-l-teal-500"
                    >
                        {data.items.map((item, index) => {
                            const lineTotal =
                                item.quantity * item.unitPrice * (1 - ((item.discount ?? 0)) / 100);
                            return (
                                <div key={index} className="py-2.5 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-sm font-medium text-gray-800 flex-1">
                                            <span className="text-gray-400 mr-1.5">{index + 1}.</span>
                                            {getProductName(item.productId)}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-800 shrink-0">
                                            ฿{formatNumber(lineTotal)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-400 pl-4">
                                        <span>{item.quantity.toLocaleString()} ชิ้น</span>
                                        <span>×</span>
                                        <span>฿{formatNumber(item.unitPrice)}</span>
                                        {(item.discount ?? 0) > 0 && (
                                            <>
                                                <span>·</span>
                                                <span className="text-red-400">ส่วนลด {item.discount}%</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </SectionCard>

                    {/* Notes */}
                    {data.notes && (
                        <SectionCard
                            icon={<FileText className="h-4 w-4" />}
                            title="หมายเหตุ"
                            accent="border-l-gray-400"
                        >
                            <div className="py-2.5">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
                            </div>
                        </SectionCard>
                    )}

                    {/* Totals */}
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                        <div className="px-4 py-3 space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>รวมเป็นเงิน</span>
                                <span className="font-medium">฿{formatNumber(data.subtotal)}</span>
                            </div>
                            {data.shippingCost > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>ส่วนลดค่าขนส่ง</span>
                                    <span>-฿{formatNumber(data.shippingCost)}</span>
                                </div>
                            )}
                            {data.otherCosts > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>
                                        ส่วนลดหน้าบิล
                                        {data.otherCostsDescription
                                            ? ` (${data.otherCostsDescription})`
                                            : ""}
                                    </span>
                                    <span>-฿{formatNumber(data.otherCosts)}</span>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-gray-200 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 flex justify-between items-center">
                            <span className="font-bold text-gray-700">ยอดเงินสุทธิ</span>
                            <span className="text-xl font-extrabold text-green-600">
                                ฿{formatNumber(data.total)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-4 border-t bg-white rounded-b-2xl">
                    <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 sm:flex-none sm:w-28 rounded-xl border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                            <X className="h-4 w-4 mr-1" />
                            แก้ไข
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    กำลังบันทึก...
                                </span>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-1" />
                                    ยืนยันบันทึก
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SaleConfirmDialog;
