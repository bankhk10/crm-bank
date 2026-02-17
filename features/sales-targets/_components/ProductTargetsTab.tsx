"use client";

import { Loader2, Save, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/src/shared/utils/currency.utils";
import { MONTHS } from "@/features/sales-targets/_lib/constants";
import { ProductInfo } from "@/src/core/sales-targets/sales-target.types";
import { useState } from "react";
import { toast } from "sonner";

interface ProductTargetsTabProps {
    products: ProductInfo[];
    targets: Record<string, Record<number, number>>;
    onChange: (productId: string, month: number, value: number) => void;
    onSave: () => void;
    saving: boolean;
    onSearch: (search: string) => Promise<ProductInfo[]>;
    onAddProducts: (products: ProductInfo[]) => void;
}

export function ProductTargetsTab({
    products,
    targets,
    onChange,
    onSave,
    saving,
    onSearch,
    onAddProducts,
}: ProductTargetsTabProps) {
    const [productSearch, setProductSearch] = useState("");

    const calculateTotal = (productId: string) => {
        return Object.values(targets[productId] || {}).reduce(
            (sum, val) => sum + (val || 0),
            0,
        );
    };

    const handleSearch = async () => {
        if (!productSearch.trim()) {
            toast.info("กรุณาระบุคำค้นหา");
            return;
        }
        const results = await onSearch(productSearch);
        if (results.length === 0) {
            toast.info("ไม่พบสินค้าที่ค้นหา");
            return;
        }
        // Add all found products
        const newProducts = results.filter(
            (p: ProductInfo) => !products.find((ep) => ep.id === p.id),
        );
        if (newProducts.length === 0) {
            toast.info("สินค้าที่ค้นหาถูกเพิ่มแล้ว");
            return;
        }
        onAddProducts(newProducts);
        setProductSearch("");
        toast.success(`เพิ่ม ${newProducts.length} สินค้าแล้ว`);
    };

    return (
        <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
            <CardHeader className="border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <CardTitle>เป้าหมายตามสินค้า</CardTitle>
                            <p className="text-sm text-slate-500 mt-1">
                                ค้นหาและเพิ่มสินค้าที่ต้องการตั้งเป้าหมาย
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-lg shadow-teal-500/25"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        บันทึก
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {/* Product Search */}
                <div className="mb-6">
                    <Label className="text-sm font-semibold text-slate-700 mb-2 block">
                        ค้นหาสินค้า
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            placeholder="พิมพ์รหัสสินค้าหรือชื่อสินค้า..."
                            className="flex-1 bg-white border-teal-200"
                        />
                        <Button
                            onClick={handleSearch}
                            className="bg-teal-500 hover:bg-teal-600 text-white"
                        >
                            ค้นหา
                        </Button>
                    </div>
                </div>

                {/* Product List */}
                {products.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>ยังไม่มีสินค้าที่ต้องการตั้งเป้าหมาย</p>
                        <p className="text-sm mt-1">
                            ค้นหาและเพิ่มสินค้าจากช่องค้นหาด้านบน
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {products.map((product) => (
                            <div key={product.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600" />
                                        <span className="text-xs font-mono bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                                            {product.productCode}
                                        </span>
                                        {product.name}
                                    </h3>
                                    <span className="text-sm font-medium text-teal-600">
                                        รวม: ฿{formatCurrency(calculateTotal(product.id))}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                                    {MONTHS.map((month) => (
                                        <div
                                            key={`${product.id}-${month.value}`}
                                            className="p-2 rounded-lg bg-teal-50/50 border border-teal-100"
                                        >
                                            <Label className="text-xs text-slate-500 block mb-1">
                                                {month.label.slice(0, 3)}.
                                            </Label>
                                            <Input
                                                type="number"
                                                onWheel={(e) => e.currentTarget.blur()}
                                                value={targets[product.id]?.[month.value] || ""}
                                                onChange={(e) =>
                                                    onChange(
                                                        product.id,
                                                        month.value,
                                                        parseFloat(e.target.value) || 0,
                                                    )
                                                }
                                                placeholder="0"
                                                className="h-9 text-sm bg-white border-teal-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
