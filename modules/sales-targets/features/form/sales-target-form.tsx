"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormCombobox } from "@/components/custom/FormCombobox";
import {
    AlertTriangle,
    ChevronLeft,
    Copy,
    Loader2,
    Package,
    Pencil,
    ShoppingCart,
    Target,
    Trash2,
} from "lucide-react";
import { MONTHS, YEARS } from "../../constants";
import {
    createSalesTargetAction,
    updateSalesTargetAction,
} from "../../server/actions";

interface ProductItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    amount: number;
    unit: string;
}

/** mode="copy" = สร้างใหม่โดยคัดลอกข้อมูลจาก initialData (ไม่มี id) */
interface SalesTargetFormProps {
    mode: "create" | "edit" | "copy";
    initialData?: any | null;
}

export function SalesTargetForm({ mode, initialData }: SalesTargetFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Form State
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [employeeId, setEmployeeId] = useState("");
    const [customerId, setCustomerId] = useState("");
    const [items, setItems] = useState<ProductItem[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const clearError = (field: string) => {
        if (errors[field]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Selection Data
    const [employees, setEmployees] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const isEdit = mode === "edit";
    const isCopy = mode === "copy";

    const totalAmount = useMemo(
        () => items.reduce((s, i) => s + i.amount, 0),
        [items],
    );

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setYear(initialData.year);
            setMonth(initialData.month);
            setEmployeeId(initialData.employeeId);
            setCustomerId(initialData.customerId);
            setItems(
                initialData.items?.map((i: any) => {
                    const qty = i.quantity || 1;
                    const amt = Number(i.amount || 0);
                    return {
                        productId: i.productId,
                        name: i.product?.name || i.name,
                        quantity: qty,
                        price: amt / qty,
                        amount: amt,
                        unit: i.product?.unit || "หน่วย",
                    };
                }) || [],
            );
        } else if (!isEdit) {
            setYear(new Date().getFullYear());
            setMonth(new Date().getMonth() + 1);
            setEmployeeId("");
            setCustomerId("");
            setItems([]);
        }
    }, [initialData, isEdit]);

    const fetchInitialData = async () => {
        try {
            // Fetch Employees
            import("@/modules/employee/server/actions").then(async ({ getEmployeesAction }) => {
                const empRes = await getEmployeesAction();
                if (empRes.success) {
                    setEmployees(empRes.employees || []);
                }
            });

            // Fetch Customers (Initial list)
            const custRes = await fetch("/api/customers?perPage=50");
            if (custRes.ok) {
                const data = await custRes.json();
                setCustomers(data.customers || data);
            }

            // Fetch Products (Initial list)
            const prodRes = await fetch("/api/products?perPage=50&status=ACTIVE");
            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.products || data);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    const handleAddItem = (product: any) => {
        if (items.some((i) => i.productId === product.id)) {
            toast.info("สินค้านี้ถูกเพิ่มแล้ว");
            return;
        }
        const price = Number(product.cartonPrice || 0);
        setItems([
            ...items,
            {
                productId: product.id,
                name: product.name,
                quantity: 1,
                price: price,
                amount: price,
                unit: product.unit || "หน่วย",
            },
        ]);
        clearError("items");
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleUpdateItem = (
        index: number,
        field: keyof ProductItem,
        value: number,
    ) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === "quantity") {
            item.quantity = value;
            item.amount = item.price * value;
        } else if (field === "price") {
            item.price = value;
            item.amount = value * item.quantity;
        } else if (field === "amount") {
            item.amount = value;
        }

        newItems[index] = item;
        setItems(newItems);

        if (field === "quantity" && value > 0) clearError(`item-qty-${index}`);
        if (field === "price" && value > 0) clearError(`item-price-${index}`);
    };

    const [duplicateId, setDuplicateId] = useState<string | null>(null);

    const handleSave = async () => {
        const newErrors: Record<string, string> = {};
        if (!year) newErrors.year = "กรุณาเลือกปี";
        if (!month) newErrors.month = "กรุณาเลือกเดือน";
        if (!employeeId) newErrors.employeeId = "กรุณาเลือกพนักงานขาย";
        if (!customerId) newErrors.customerId = "กรุณาเลือกลูกค้า/ร้านค้า";
        if (items.length === 0) newErrors.items = "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ";

        items.forEach((item, idx) => {
            if (!item.quantity || item.quantity <= 0) newErrors[`item-qty-${idx}`] = "ระบุจำนวน";
            if (!item.price || item.price <= 0) newErrors[`item-price-${idx}`] = "ระบุราคา";
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setDuplicateId(null);
        setSaving(true);
        try {
            const payload = {
                year,
                month,
                employeeId,
                customerId,
                items: items.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    amount: i.amount,
                })),
            };

            let result;
            if (isEdit && initialData?.id) {
                result = await updateSalesTargetAction(initialData.id, payload);
            } else {
                result = await createSalesTargetAction(payload);
            }

            if (result.success) {
                toast.success("บันทึกสำเร็จ");
                router.push("/sales-targets");
                router.refresh();
            } else {
                // Store duplicateId for redirect button
                if ("duplicateId" in result && result.duplicateId) {
                    setDuplicateId(result.duplicateId as string);
                }
                toast.error(result.error || "เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Modern Header with Glassmorphism */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 blur-3xl" />
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/10 p-6 sm:p-8">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/sales-targets"
                                className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                            </Link>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                        {isEdit
                                            ? "แก้ไขเป้าหมายการขาย"
                                            : isCopy
                                                ? "คัดลอกเป้าหมายการขาย"
                                                : "เพิ่มเป้าหมายการขาย"}
                                    </h1>
                                </div>
                                {isCopy && (
                                    <p className="text-sm text-amber-600 flex items-center gap-1.5 mt-1">
                                        <Copy className="w-3.5 h-3.5" />
                                        คัดลอกจากรายการเดิม — กรุณาตรวจสอบข้อมูลก่อนบันทึก
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/5 rounded-3xl overflow-hidden">
                    <CardContent className="p-6 sm:p-8 lg:p-10">
                        <div className="grid gap-10">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Column: General Info */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                                            <ShoppingCart className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            ข้อมูลทั่วไป
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2.5">
                                            <FormCombobox
                                                label="ปี"
                                                value={year.toString()}
                                                onChange={(v) => {
                                                    setYear(Number(v));
                                                    clearError("year");
                                                }}
                                                options={YEARS.map((y) => ({
                                                    value: y.toString(),
                                                    label: (y + 543).toString(),
                                                }))}
                                                placeholder="เลือกปี"
                                                searchPlaceholder="ค้นหาปี..."
                                                emptyText="ไม่พบปี"
                                                error={errors.year}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2.5">
                                            <FormCombobox
                                                label="เดือน"
                                                value={month.toString()}
                                                onChange={(v) => {
                                                    setMonth(Number(v));
                                                    clearError("month");
                                                }}
                                                options={MONTHS.map((m) => ({
                                                    value: m.value.toString(),
                                                    label: m.label,
                                                }))}
                                                placeholder="เลือกเดือน"
                                                searchPlaceholder="ค้นหาเดือน..."
                                                emptyText="ไม่พบเดือน"
                                                error={errors.month}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <FormCombobox
                                            label="พนักงานขาย"
                                            value={employeeId}
                                            onChange={(val) => {
                                                setEmployeeId(val);
                                                clearError("employeeId");
                                            }}
                                            options={employees.map((emp) => ({
                                                value: emp.id,
                                                label: `${emp.name} (${emp.employeeCode || "-"})`,
                                            }))}
                                            placeholder="เลือกพนักงาน"
                                            searchPlaceholder="ค้นหาพนักงาน..."
                                            emptyText="ไม่พบพนักงาน"
                                            error={errors.employeeId}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        <FormCombobox
                                            label="ลูกค้า/ร้านค้า"
                                            value={customerId}
                                            onChange={(val) => {
                                                setCustomerId(val);
                                                clearError("customerId");
                                            }}
                                            options={customers.map((customer) => ({
                                                value: customer.id,
                                                label: `${customer.name} (${customer.customerCode || "-"})`,
                                            }))}
                                            placeholder="เลือกลูกค้า"
                                            searchPlaceholder="ค้นหาลูกค้า..."
                                            emptyText="ไม่พบลูกค้า"
                                            error={errors.customerId}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Product Items */}
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                                                <Package className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800">
                                                รายการสินค้า
                                            </h3>
                                        </div>
                                        <div className="w-full sm:w-[300px]">
                                            <FormCombobox
                                                label=""
                                                value=""
                                                onChange={(val) => {
                                                    const p = products.find((x) => x.id === val);
                                                    if (p) handleAddItem(p);
                                                }}
                                                options={products.map((p) => ({
                                                    value: p.id,
                                                    label: `${p.name} (${p.productCode || "-"})`,
                                                }))}
                                                placeholder="เพิ่มสินค้า..."
                                                searchPlaceholder="ค้นหาสินค้า..."
                                                emptyText="ไม่พบสินค้า"
                                            />
                                        </div>
                                    </div>

                                    <div className={`space-y-3 min-h-[350px] bg-gradient-to-br from-slate-50/80 to-blue-50/30 rounded-2xl p-5 border-2 border-dashed transition-colors ${errors.items ? "border-red-400 bg-red-50/10" : "border-slate-200/80"}`}>
                                        {errors.items && (
                                            <p className="text-sm font-medium text-red-500 text-center mb-4 flex items-center justify-center gap-1.5">
                                                <AlertTriangle className="w-4 h-4" />
                                                {errors.items}
                                            </p>
                                        )}
                                        {items.length === 0 && (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-in fade-in duration-500">
                                                <div className="relative mb-6">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-2xl rounded-full" />
                                                    <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200/60">
                                                        <Package className="w-9 h-9 text-slate-400" />
                                                    </div>
                                                </div>
                                                <p className="font-semibold text-slate-700 text-lg mb-2">
                                                    ยังไม่มีรายการสินค้า
                                                </p>
                                                <p className="text-sm text-slate-500 max-w-xs">
                                                    กดปุ่ม &quot;เพิ่มสินค้า&quot;
                                                    เพื่อเริ่มเพิ่มรายการเป้าหมายการขาย
                                                </p>
                                            </div>
                                        )}
                                        {items.map((item, index) => (
                                            <div
                                                key={item.productId}
                                                className="group relative bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-300/60 hover:-translate-y-1"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div className="relative space-y-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 pr-4">
                                                            <div className="text-sm font-bold text-slate-800 mb-1">
                                                                {item.name}
                                                            </div>
                                                            <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600 font-medium">
                                                                {item.productId.substring(0, 12)}...
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                                ราคา/{item.unit || "-"}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                className={`h-11 bg-slate-50/80 border-slate-200/80 hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-right font-semibold text-slate-800 transition-all ${errors[`item-price-${index}`] ? "border-red-500 focus:ring-red-500 bg-red-50/30" : ""}`}
                                                                value={item.price}
                                                                onChange={(e) =>
                                                                    handleUpdateItem(
                                                                        index,
                                                                        "price",
                                                                        Number(e.target.value),
                                                                    )
                                                                }
                                                                onWheel={(e) => e.currentTarget.blur()}
                                                            />
                                                            {errors[`item-price-${index}`] && (
                                                                <p className="text-[10px] text-red-600 font-medium mt-1">
                                                                    {errors[`item-price-${index}`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                                จำนวน/{item.unit || "-"}
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                className={`h-11 bg-slate-50/80 border-slate-200/80 hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-right font-semibold text-slate-800 transition-all ${errors[`item-qty-${index}`] ? "border-red-500 focus:ring-red-500 bg-red-50/30" : ""}`}
                                                                value={item.quantity}
                                                                onChange={(e) =>
                                                                    handleUpdateItem(
                                                                        index,
                                                                        "quantity",
                                                                        Number(e.target.value),
                                                                    )
                                                                }
                                                                onWheel={(e) => e.currentTarget.blur()}
                                                            />
                                                            {errors[`item-qty-${index}`] && (
                                                                <p className="text-[10px] text-red-600 font-medium mt-1">
                                                                    {errors[`item-qty-${index}`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                                                เป้าหมาย (บาท)
                                                            </Label>
                                                            <Input
                                                                readOnly
                                                                type="number"
                                                                className="h-11 bg-emerald-50/80 border-emerald-200/80 hover:border-emerald-300/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-right font-bold text-emerald-700 transition-all cursor-not-allowed opacity-90"
                                                                value={item.amount}
                                                                tabIndex={-1}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {items.length > 0 && (
                                        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

                                            <div className="relative space-y-4">
                                                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                                    <span className="text-slate-400 text-sm font-medium">
                                                        จำนวนรายการ
                                                    </span>
                                                    <span className="text-white font-bold text-lg">
                                                        {items.length} รายการ
                                                    </span>
                                                </div>

                                                <div className="flex items-end justify-between pt-2">
                                                    <div>
                                                        <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">
                                                            รวมยอดเงินเป้าหมาย
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            โดยประมาณ
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-emerald-400 text-sm font-medium">
                                                                ฿
                                                            </span>
                                                            <span className="text-4xl font-black text-white tracking-tight">
                                                                {totalAmount.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Duplicate warning banner */}
                            {duplicateId && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                                    <div className="flex items-center gap-2 flex-1">
                                        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                                        <span className="text-sm font-medium">
                                            มีรายการนี้อยู่แล้ว คุณสามารถไปแก้ไขรายการที่มีอยู่ได้
                                        </span>
                                    </div>
                                    <Link href={`/sales-targets/${duplicateId}/edit`} className="shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-xl border-amber-300 bg-white hover:bg-amber-50 text-amber-700 font-semibold"
                                        >
                                            <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                            ไปแก้ไขรายการ
                                        </Button>
                                    </Link>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t border-slate-100">
                                <Link href="/sales-targets" className="w-full sm:w-auto">
                                    <Button
                                        variant="outline"
                                        className="w-full h-12 px-8 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                                    >
                                        ยกเลิก
                                    </Button>
                                </Link>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full sm:w-auto h-12 px-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-blue-500/30 font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {saving
                                        ? "กำลังบันทึก..."
                                        : isEdit
                                            ? "บันทึกการแก้ไข"
                                            : "บันทึก"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
