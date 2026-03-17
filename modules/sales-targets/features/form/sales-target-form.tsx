"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormCombobox } from "@/components/custom/FormCombobox";
import { FormInput } from "@/components/custom/FormInput";
import FormActions from "@/components/custom/form-actions";
import {
    AlertTriangle,
    ChevronLeft,
    Copy,
    MapPin,
    Pencil,
    Store,
    Trash2,
} from "lucide-react";
import { MONTHS, YEARS } from "../../constants";
import {
    createSalesTargetAction,
    updateSalesTargetAction,
    getAvailableYearsAction,
} from "../../server/actions";

// ─────────────────────────────────────────────
// Local Types
// ─────────────────────────────────────────────

interface ProductItem {
    productId: string;
    name: string;
    productCode: string;
    unit: string;
    pricePerBox: number;
    qtyPerBox: number;
    targetAmount: number;
}

interface StoreEntry {
    customerId: string;
    name: string;
    customerCode: string;
    items: ProductItem[];
}

/** mode="copy" = สร้างใหม่โดยคัดลอกข้อมูลจาก initialData (ไม่มี id) */
interface SalesTargetFormProps {
    mode: "create" | "edit" | "copy";
    initialData?: any | null;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function SalesTargetForm({ mode, initialData }: SalesTargetFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Form State
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [employeeId, setEmployeeId] = useState("");
    const [stores, setStores] = useState<StoreEntry[]>([]);
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
    const [availableYears, setAvailableYears] = useState<number[]>(YEARS);

    const isEdit = mode === "edit";
    const isCopy = mode === "copy";

    // Total across all stores
    const grandTotal = useMemo(() => {
        return stores.reduce(
            (sum, store) =>
                sum + store.items.reduce((s, item) => s + item.targetAmount, 0),
            0,
        );
    }, [stores]);



    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setYear(initialData.year);
            setMonth(initialData.month);
            setEmployeeId(initialData.employeeId);
            // Convert stores from initialData
            if (initialData.stores) {
                setStores(
                    initialData.stores.map((store: any) => ({
                        customerId: store.customerId,
                        name: store.customer?.name || "",
                        customerCode: store.customer?.customerCode || "-",
                        items: store.items?.map((item: any) => ({
                            productId: item.productId,
                            name: item.product?.name || "",
                            productCode: item.product?.productCode || "-",
                            unit: item.product?.unit || "ลัง",
                            pricePerBox: Number(item.pricePerBox || 0),
                            qtyPerBox: Number(item.qtyPerBox || 0),
                            targetAmount: Number(item.targetAmount || 0),
                        })) || [],
                    })),
                );
            }
        } else if (!isEdit) {
            setYear(new Date().getFullYear());
            setMonth(new Date().getMonth() + 1);
            setEmployeeId("");
            setStores([]);
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

            // Fetch Customers
            const custRes = await fetch("/api/customers?perPage=200");
            if (custRes.ok) {
                const data = await custRes.json();
                setCustomers(data.customers || data);
            }

            // Fetch Products
            const prodRes = await fetch("/api/products?perPage=200&status=ACTIVE");
            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.products || data);
            }

            // Fetch Years
            const yearRes = await getAvailableYearsAction();
            if (yearRes.success && yearRes.years) {
                setAvailableYears(yearRes.years);
            }
        } catch (error) {
            console.error("Error fetching data", error);
        }
    };

    // ─────────────────────────────────────────────
    // Store handlers
    // ─────────────────────────────────────────────

    const handleAddStore = useCallback(
        (customerId: string) => {
            if (stores.some((s) => s.customerId === customerId)) {
                toast.info("ร้านค้านี้ถูกเพิ่มแล้ว");
                return;
            }
            const customer = customers.find((c) => c.id === customerId);
            if (!customer) return;

            setStores([
                ...stores,
                {
                    customerId: customer.id,
                    name: customer.name,
                    customerCode: customer.customerCode || "-",
                    items: [],
                },
            ]);
            clearError("stores");
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stores, customers],
    );

    const handleRemoveStore = useCallback(
        (storeIndex: number) => {
            setStores(stores.filter((_, i) => i !== storeIndex));
        },
        [stores],
    );

    // ─────────────────────────────────────────────
    // Item handlers
    // ─────────────────────────────────────────────

    const handleAddItem = useCallback(
        (storeIndex: number, productId: string) => {
            const store = stores[storeIndex];
            if (store.items.some((item) => item.productId === productId)) {
                toast.info("สินค้านี้ถูกเพิ่มแล้วในร้านค้านี้");
                return;
            }
            const product = products.find((p) => p.id === productId);
            if (!product) return;

            const price = Number(product.cartonPrice || 0);

            const newStores = [...stores];
            newStores[storeIndex] = {
                ...store,
                items: [
                    ...store.items,
                    {
                        productId: product.id,
                        name: product.name,
                        productCode: product.productCode || "-",
                        unit: product.unit || "ลัง",
                        pricePerBox: price,
                        qtyPerBox: 1,
                        targetAmount: price,
                    },
                ],
            };
            setStores(newStores);
            clearError(`store-${storeIndex}-items`);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [stores, products],
    );

    const handleRemoveItem = useCallback(
        (storeIndex: number, itemIndex: number) => {
            const newStores = [...stores];
            newStores[storeIndex] = {
                ...newStores[storeIndex],
                items: newStores[storeIndex].items.filter((_, i) => i !== itemIndex),
            };
            setStores(newStores);
        },
        [stores],
    );

    const handleUpdateItem = useCallback(
        (
            storeIndex: number,
            itemIndex: number,
            field: "pricePerBox" | "qtyPerBox" | "targetAmount",
            value: number,
        ) => {
            const newStores = [...stores];
            const item = { ...newStores[storeIndex].items[itemIndex] };

            if (field === "pricePerBox") {
                item.pricePerBox = value;
                item.targetAmount = value * item.qtyPerBox;
            } else if (field === "qtyPerBox") {
                item.qtyPerBox = value;
                item.targetAmount = item.pricePerBox * value;
            } else if (field === "targetAmount") {
                item.targetAmount = value;
            }

            newStores[storeIndex] = {
                ...newStores[storeIndex],
                items: newStores[storeIndex].items.map((it, i) =>
                    i === itemIndex ? item : it,
                ),
            };
            setStores(newStores);
        },
        [stores],
    );

    // ─────────────────────────────────────────────
    // Clone store items from another store
    // ─────────────────────────────────────────────

    const handleCloneStoreItems = useCallback(
        (targetStoreIndex: number, sourceStoreIndex: number) => {
            const source = stores[sourceStoreIndex];
            if (!source || source.items.length === 0) {
                toast.info("ร้านค้าต้นทางไม่มีรายการสินค้า");
                return;
            }

            const target = stores[targetStoreIndex];
            const existingProductIds = new Set(target.items.map((i) => i.productId));

            // Only clone items not already existing
            const newItems = source.items
                .filter((i) => !existingProductIds.has(i.productId))
                .map((i) => ({ ...i }));

            if (newItems.length === 0) {
                toast.info("ร้านค้านี้มีรายการสินค้าทั้งหมดแล้ว");
                return;
            }

            const newStores = [...stores];
            newStores[targetStoreIndex] = {
                ...target,
                items: [...target.items, ...newItems],
            };
            setStores(newStores);
            toast.success(`เพิ่ม ${newItems.length} รายการจาก ${source.name}`);
        },
        [stores],
    );



    // ─────────────────────────────────────────────
    // Submit
    // ─────────────────────────────────────────────

    const [duplicateId, setDuplicateId] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!year) newErrors.year = "กรุณาเลือกปี";
        if (!month) newErrors.month = "กรุณาเลือกเดือน";
        if (!employeeId) newErrors.employeeId = "กรุณาเลือกพนักงานขาย";
        if (stores.length === 0)
            newErrors.stores = "กรุณาเพิ่มอย่างน้อย 1 ร้านค้า";

        stores.forEach((store, si) => {
            if (store.items.length === 0)
                newErrors[`store-${si}-items`] =
                    "กรุณาเพิ่มอย่างน้อย 1 รายการสินค้า";
            store.items.forEach((item, ii) => {
                if (!item.qtyPerBox || item.qtyPerBox <= 0)
                    newErrors[`store-${si}-item-${ii}-qty`] = "ระบุจำนวน";
                if (!item.pricePerBox || item.pricePerBox <= 0)
                    newErrors[`store-${si}-item-${ii}-price`] = "ระบุราคา";
            });
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
                stores: stores.map((store) => ({
                    customerId: store.customerId,
                    items: store.items.map((item) => ({
                        productId: item.productId,
                        pricePerBox: item.pricePerBox,
                        qtyPerBox: item.qtyPerBox,
                        targetAmount: item.targetAmount,
                    })),
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

    // Available customers (exclude already added)
    const availableCustomers = useMemo(() => {
        const addedIds = new Set(stores.map((s) => s.customerId));
        return customers.filter((c) => !addedIds.has(c.id));
    }, [customers, stores]);

    return (
        <section className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-12 px-2 sm:px-0">
            <Card className="border-0 rounded-none sm:border sm:rounded-2xl shadow-none sm:shadow-lg bg-white/50 sm:bg-white">
                <div className="p-4 sm:p-6 md:p-8">
                    <div className="text-center relative mb-6 md:mb-8">
                        <h5 className="font-bold text-2xl md:text-3xl lg:text-4xl text-slate-800 tracking-tight sm:border-b sm:border-slate-200 pb-2 sm:pb-6">
                            {isEdit
                                ? "แก้ไขเป้าหมายการขาย"
                                : isCopy
                                    ? "คัดลอกเป้าหมายการขาย"
                                    : "เพิ่มเป้าหมายการขาย"}
                        </h5>
                    </div>
                    {isCopy && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 mb-6 md:mb-8 flex items-center justify-center gap-2">
                            <Copy className="w-4 h-4 md:w-5 md:h-5 text-amber-600" />
                            <p className="text-sm md:text-base font-medium text-amber-800 text-center">
                                คัดลอกจากรายการเดิม — กรุณาตรวจสอบข้อมูลก่อนบันทึก
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10" noValidate>


                        {/* Step 1: General Info Section */}
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-lg md:text-xl font-bold text-slate-800 bg-slate-200 px-4 py-3 md:px-6 md:py-4 rounded-xl flex items-center gap-2">
                                <span className="flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] md:text-sm font-bold text-white">1</span>
                                ข้อมูลทั่วไป
                            </h3>
                            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 mt-4 px-1">
                                <FormCombobox
                                    label="ปี"
                                    value={year.toString()}
                                    onChange={(v) => {
                                        setYear(Number(v));
                                        clearError("year");
                                    }}
                                    options={availableYears.map((y) => ({
                                        value: y.toString(),
                                        label: (y + 543).toString(),
                                    }))}
                                    placeholder="เลือกปี"
                                    searchPlaceholder="ค้นหาปี..."
                                    emptyText="ไม่พบปี"
                                    error={errors.year}
                                    triggerClassName="h-10 sm:h-12 text-base sm:text-base rounded-lg"
                                    required
                                />

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
                                    triggerClassName="h-10 sm:h-12 text-base sm:text-base rounded-lg"
                                    required
                                />

                                <div className="sm:col-span-2">
                                    <FormCombobox
                                        label="พนักงานขาย"
                                        value={employeeId}
                                        onChange={(val) => {
                                            setEmployeeId(val);
                                            clearError("employeeId");
                                        }}
                                        options={employees.map((emp) => ({
                                            value: emp.id,
                                            label: `${emp.name}`,
                                        }))}
                                        placeholder="เลือกพนักงาน"
                                        searchPlaceholder="ค้นหาพนักงาน..."
                                        emptyText="ไม่พบพนักงาน"
                                        error={errors.employeeId}
                                        triggerClassName="h-10 sm:h-12 text-base sm:text-base rounded-lg"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Stores Section */}
                        <div className="space-y-4 md:space-y-6">
                            <h3 className="text-lg md:text-xl font-bold text-slate-800 bg-slate-200 px-4 py-3 md:px-6 md:py-4 rounded-xl flex items-center gap-2">
                                <span className="flex h-6 w-6 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] md:text-sm font-bold text-white">2</span>
                                ข้อมูลตั้งเป้าหมาย
                            </h3>
                            <div className="w-full px-1">
                                <FormCombobox
                                    label="เพิ่มร้านค้า"
                                    value=""
                                    onChange={(val) => handleAddStore(val)}
                                    options={availableCustomers.map((c) => ({
                                        value: c.id,
                                        label: `${c.name}`,
                                    }))}
                                    placeholder="เลือกร้านค้า"
                                    searchPlaceholder="ค้นหาร้านค้า..."
                                    emptyText="ไม่พบร้านค้า"
                                    triggerClassName="h-10 sm:h-12 text-base sm:text-base rounded-lg"
                                />
                            </div>

                            {errors.stores && (
                                <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl flex items-center justify-center gap-2 mx-1">
                                    <AlertTriangle className="w-5 h-5" />
                                    {errors.stores}
                                </p>
                            )}

                            {stores.length === 0 && (
                                <div className="flex flex-col items-center justify-center text-center py-12 md:py-16 px-4 animate-in fade-in duration-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl md:mx-1">
                                    <div className="relative mb-4 md:mb-6">
                                        <div className="absolute inset-0 bg-linear-to-r from-emerald-500/10 to-teal-500/10 blur-2xl rounded-full" />
                                        <div className="relative w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                            <Store className="w-8 h-8 md:w-9 md:h-9 text-slate-400" />
                                        </div>
                                    </div>
                                    <p className="font-bold text-slate-700 text-base md:text-lg mb-1 md:mb-2">
                                        ยังไม่มีร้านค้าในเป้าหมาย
                                    </p>
                                    <p className="text-sm text-slate-500 max-w-[250px] md:max-w-xs leading-relaxed">
                                        เลือกร้านค้าจากช่องค้นหาด้านบน เพื่อเริ่มต้นกำหนดเป้าหมาย
                                    </p>
                                </div>
                            )}

                            {/* Store List */}
                            <div className="space-y-4 sm:space-y-6 md:mx-1 pt-2">
                                {stores.map((store, storeIndex) => (
                                    <StoreCard
                                        key={store.customerId}
                                        store={store}
                                        storeIndex={storeIndex}
                                        stores={stores}
                                        products={products}
                                        errors={errors}
                                        onRemoveStore={handleRemoveStore}
                                        onAddItem={handleAddItem}
                                        onRemoveItem={handleRemoveItem}
                                        onUpdateItem={handleUpdateItem}
                                        onCloneStoreItems={handleCloneStoreItems}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Grand Total */}
                        {stores.length > 0 && (
                            <div className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-700/50 mt-6 md:mx-1">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />

                                <div className="relative space-y-3 sm:space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2">
                                        <span className="text-sm sm:text-base text-slate-400 font-medium">
                                            จำนวนร้านค้า
                                        </span>
                                        <span className="text-sm sm:text-base text-slate-300 font-medium text-right">
                                            <span className="text-white font-bold">{stores.length}</span> ร้าน
                                        </span>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between pt-2 gap-2 sm:gap-4">
                                        <div>
                                            <span className="text-xs sm:text-sm text-slate-400 uppercase tracking-wider block font-bold">
                                                รวมยอดเงินเป้าหมาย
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-baseline gap-1.5 sm:gap-2 justify-end">
                                                <span className="text-emerald-400 text-lg sm:text-xl font-medium">
                                                    ฿
                                                </span>
                                                <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter">
                                                    {grandTotal.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Duplicate warning */}
                        {duplicateId && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                                <div className="flex items-center gap-2 flex-1">
                                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                                    <span className="text-sm font-medium">
                                        มีรายการนี้อยู่แล้ว คุณสามารถไปแก้ไขรายการที่มีอยู่ได้
                                    </span>
                                </div>
                                <Link
                                    href={`/sales-targets/${duplicateId}/edit`}
                                    className="shrink-0"
                                >
                                    <Button
                                        type="button"
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
                        <div className="pt-8 mt-10">
                            <FormActions
                                loading={saving}
                                onCancel={() => router.push("/sales-targets")}
                                submitLabel={isEdit ? "บันทึก" : "บันทึกข้อมูล"}
                            />
                        </div>
                    </form>
                </div>
            </Card>
        </section>
    );
}

// ─────────────────────────────────────────────
// StoreCard Sub-component
// ─────────────────────────────────────────────

function StoreCard({
    store,
    storeIndex,
    stores,
    products,
    errors,
    onRemoveStore,
    onAddItem,
    onRemoveItem,
    onUpdateItem,
    onCloneStoreItems,
}: {
    store: StoreEntry;
    storeIndex: number;
    stores: StoreEntry[];
    products: any[];
    errors: Record<string, string>;
    onRemoveStore: (i: number) => void;
    onAddItem: (si: number, productId: string) => void;
    onRemoveItem: (si: number, ii: number) => void;
    onUpdateItem: (
        si: number,
        ii: number,
        field: "pricePerBox" | "qtyPerBox" | "targetAmount",
        value: number,
    ) => void;
    onCloneStoreItems: (target: number, source: number) => void;
}) {
    const storeTotal = useMemo(
        () => store.items.reduce((sum, item) => sum + item.targetAmount, 0),
        [store.items],
    );

    // Available products not already in this store
    const availableProducts = useMemo(() => {
        const addedIds = new Set(store.items.map((i) => i.productId));
        return products.filter((p) => !addedIds.has(p.id));
    }, [products, store.items]);

    // Other stores for clone feature
    const otherStores = useMemo(
        () =>
            stores
                .map((s, i) => ({ ...s, index: i }))
                .filter((s) => s.index !== storeIndex && s.items.length > 0),
        [stores, storeIndex],
    );

    return (
        <div className="group relative bg-white sm:bg-linear-to-br sm:from-slate-50/80 sm:to-blue-50/30 rounded-2xl sm:p-5 p-4 border border-slate-200 sm:border-2 sm:border-dashed sm:border-slate-200/80 transition-all duration-300 sm:hover:border-slate-300/80 shadow-sm sm:shadow-none">
            {/* Store Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-200/60 relative">
                <div className="flex items-start sm:items-center gap-3 pr-10 sm:pr-0">
                    <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight truncate">
                            {store.name}
                        </h3>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 w-full sm:w-auto">
                    {/* Clone from other store */}
                    {otherStores.length > 0 && (
                        <div className="w-full sm:w-auto order-2 sm:order-1">
                            <FormCombobox
                                label=""
                                value=""
                                onChange={(val) => {
                                    onCloneStoreItems(storeIndex, Number(val));
                                }}
                                options={otherStores.map((s) => ({
                                    value: s.index.toString(),
                                    label: s.name,
                                }))}
                                placeholder="คัดลอกสินค้าจากร้านอื่น..."
                                searchPlaceholder="ค้นหาร้าน..."
                                emptyText="ไม่มีร้านอื่น"
                                triggerClassName="h-11 sm:h-9 text-sm sm:text-xs w-full sm:w-[220px] bg-slate-50 border-slate-300 rounded-xl"
                            />
                        </div>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute sm:relative top-0 right-0 sm:top-auto sm:right-auto h-10 w-10 sm:h-9 sm:w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 focus:bg-red-50 rounded-xl transition-all order-1 sm:order-2 shrink-0"
                        onClick={() => onRemoveStore(storeIndex)}
                    >
                        <span className="sr-only">ลบร้านค้า</span>
                        <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </div>

            {/* Add Product Section */}
            <div className="w-full sm:w-[520px] mb-6">
                <FormCombobox
                    label="เพิ่มรายการสินค้า"
                    value=""
                    onChange={(val) => onAddItem(storeIndex, val)}
                    options={availableProducts.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.productCode || "-"})`,
                    }))}
                    placeholder="+ ค้นหาและเลือกสินค้า..."
                    searchPlaceholder="ค้นหาสินค้า..."
                    emptyText="ไม่พบสินค้า"
                    triggerClassName="h-12 sm:h-11 text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50/80 hover:border-emerald-400 transition-colors text-base sm:text-sm font-medium rounded-xl"
                />
            </div>

            {errors[`store-${storeIndex}-items`] && (
                <p className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    {errors[`store-${storeIndex}-items`]}
                </p>
            )}

            {/* Product Table Header (desktop) */}
            {store.items.length > 0 && (
                <div className="hidden sm:grid sm:grid-cols-[1fr_140px_130px_150px_44px] gap-3 px-3 mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        สินค้า
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        ราคา (บาท)
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        จำนวน
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        เป้าหมายสุทธิ
                    </span>
                    <span></span>
                </div>
            )}

            {/* Items */}
            <div className="space-y-3 sm:space-y-2">
                {store.items.map((item, itemIndex) => (
                    <div
                        key={item.productId}
                        className="bg-white rounded-2xl sm:rounded-xl border border-slate-200/70 shadow-xs hover:shadow-sm transition-all p-4 sm:p-2.5 group/item"
                    >
                        {/* Desktop row */}
                        <div className="hidden sm:grid sm:grid-cols-[1fr_140px_130px_150px_44px] gap-3 items-center">
                            <div className="min-w-0 pl-2">
                                <span className="text-sm font-bold text-slate-800 block truncate">
                                    {item.name}
                                </span>
                            </div>
                            <FormInput
                                label=""
                                type="number"
                                value={item.pricePerBox === 0 ? "" : item.pricePerBox}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                        val = val.replace(/^0+/, "");
                                    }
                                    onUpdateItem(storeIndex, itemIndex, "pricePerBox", Number(val));
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                error={errors[`store-${storeIndex}-item-${itemIndex}-price`]}
                                inputClassName="h-10 text-sm font-semibold pr-12 rounded-xl focus:border-blue-400 focus:ring-blue-100"
                                rightIcon={<span className="text-[11px] font-bold text-slate-400 mr-1">/{item.unit || "-"}</span>}
                            />
                            <FormInput
                                label=""
                                type="number"
                                value={item.qtyPerBox === 0 ? "" : item.qtyPerBox}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                        val = val.replace(/^0+/, "");
                                    }
                                    onUpdateItem(storeIndex, itemIndex, "qtyPerBox", Number(val));
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                                error={errors[`store-${storeIndex}-item-${itemIndex}-qty`]}
                                inputClassName="h-10 text-sm font-semibold pr-12 rounded-xl focus:border-blue-400 focus:ring-blue-100"
                                rightIcon={<span className="text-[11px] font-bold text-slate-400 mr-1">/{item.unit || "-"}</span>}
                            />
                            <div className="relative">
                                <FormInput
                                    label=""
                                    type="number"
                                    value={item.targetAmount}
                                    onChange={() => { }}
                                    readOnly
                                    inputClassName="h-10 text-sm bg-emerald-50/70 border-emerald-200/80 font-bold text-emerald-700 cursor-not-allowed rounded-xl"
                                />
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <span className="text-[10px] font-bold text-emerald-600">บาท</span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl mx-auto"
                                onClick={() => onRemoveItem(storeIndex, itemIndex)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Mobile layout */}
                        <div className="sm:hidden space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1 pr-3">
                                    <span className="text-base font-bold text-slate-800 block leading-tight">
                                        {item.name}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block mt-1.5">
                                        {item.productCode}
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl shrink-0"
                                    onClick={() => onRemoveItem(storeIndex, itemIndex)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                                <FormInput
                                    label="ราคาต่อหน่วย"
                                    type="number"
                                    value={item.pricePerBox === 0 ? "" : item.pricePerBox}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                            val = val.replace(/^0+/, "");
                                        }
                                        onUpdateItem(storeIndex, itemIndex, "pricePerBox", Number(val));
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    error={errors[`store-${storeIndex}-item-${itemIndex}-price`]}
                                    inputClassName="h-12 text-base font-semibold pr-12 rounded-xl"
                                    labelClassName="text-xs font-bold text-slate-600 mb-1"
                                    rightIcon={<span className="text-[11px] font-bold text-slate-400">/{item.unit || "-"}</span>}
                                />
                                <FormInput
                                    label="จำนวน"
                                    type="number"
                                    value={item.qtyPerBox === 0 ? "" : item.qtyPerBox}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (val.length > 1 && val.startsWith("0") && val[1] !== ".") {
                                            val = val.replace(/^0+/, "");
                                        }
                                        onUpdateItem(storeIndex, itemIndex, "qtyPerBox", Number(val));
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    error={errors[`store-${storeIndex}-item-${itemIndex}-qty`]}
                                    inputClassName="h-12 text-base font-semibold pr-12 rounded-xl"
                                    labelClassName="text-xs font-bold text-slate-600 mb-1"
                                    rightIcon={<span className="text-[11px] font-bold text-slate-400">/{item.unit || "-"}</span>}
                                />
                            </div>

                            <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                                <span className="text-sm font-bold text-emerald-800">เป้าหมายรวม</span>
                                <div className="text-right flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-emerald-600">฿</span>
                                    <span className="text-xl font-black text-emerald-700 tracking-tight">{(item.targetAmount || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {store.items.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2 pr-1">
                    <span className="text-sm font-medium text-slate-500">รวมยอดร้านนี้: </span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-emerald-600 text-sm font-bold">฿</span>
                        <span className="text-xl md:text-2xl font-black text-emerald-700 tracking-tight">
                            {storeTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
