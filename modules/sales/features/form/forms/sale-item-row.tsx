"use client";

/**
 * Sale Item Row Component
 * Renders a single sale item row with product selection, quantity, and price
 */

import React from "react";
import { Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormInput, FormCombobox } from "@/components/custom/form-components";
import type { SaleItemRowProps } from "../../../types";

export function SaleItemRow({
    item,
    index,
    products,
    onUpdate,
    onRemove,
    onShowDetails,
    fieldError,
    onClearError,
}: SaleItemRowProps & { onClearError?: () => void }) {
    // onClearError is extra in local definition vs types.ts?
    // Let's check types.ts in Step 684.
    // SaleItemRowProps there does NOT have onClearError.
    // So I need to intersection type it or update types.ts
    // I'll update types.ts later if needed, but intersection is fine for now.

    const product = products.find((p) => p.id === item.productId);

    const handleProductChange = (value: string) => {
        onUpdate(index, "productId", value);
        onClearError?.();
    };

    return (
        <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-medium">รายการที่ {index + 1}</h4>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                >
                    <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
            </div>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
                {/* Product Select + Detail Button */}
                <div className="md:col-span-3 flex items-end gap-2 min-w-0">
                    <div className="flex-1">
                        <FormCombobox
                            label="สินค้า"
                            value={item.productId}
                            onChange={handleProductChange}
                            options={products.map((p) => ({
                                value: p.id,
                                label: `${p.productCode} - ${p.name}`,
                            }))}
                            placeholder="เลือกสินค้า"
                            searchPlaceholder="ค้นหาสินค้า..."
                            emptyText="ไม่พบสินค้า"
                            required
                            error={fieldError}
                        />
                    </div>

                    {product && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 mt-6 flex items-center"
                            onClick={() => onShowDetails(product)}
                        >
                            <Info className="h-4 w-4 mr-2" />
                            รายละเอียด
                        </Button>
                    )}
                </div>
            </div>

            {product && (
                <>
                    <div className="grid gap-x-4 gap-y-3 md:grid-cols-5 mt-3">
                        <FormInput
                            label={`จำนวน (${product?.unit || '-'})`}
                            type="number"
                            value={String(item.quantity)}
                            onChange={(e) => onUpdate(index, "quantity", Number(e.target.value))}
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                        <FormInput
                            label="ราคาต่อหน่วย"
                            type="number"
                            value={String(item.unitPrice)}
                            onChange={(e) => onUpdate(index, "unitPrice", Number(e.target.value))}
                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                        />
                        <FormInput
                            label="จำนวนบรรจุในลัง"
                            value={product?.packageSizePerBox || "-"}
                            onChange={() => { }}
                            disabled
                            readOnly
                            className="bg-gray-100 text-gray-500"
                        />
                        <FormInput
                            label="ราคาต่อลัง"
                            value={(() => {
                                // Try to parse pack size (e.g. "12", "12x1L")
                                const packSize = parseFloat(product?.packageSizePerBox || "0");

                                // If we have a valid pack size, calculate carton price based on current unit price
                                if (!isNaN(packSize) && packSize > 0) {
                                    const calculatedCartonPrice = item.unitPrice * packSize;
                                    return `฿${calculatedCartonPrice.toLocaleString()}`;
                                }

                                // Fallback to master data or standard dash
                                return product?.cartonPrice
                                    ? `฿${Number(product.cartonPrice).toLocaleString()}`
                                    : "-";
                            })()}
                            onChange={() => { }}
                            disabled
                            readOnly
                            className="bg-gray-100 text-gray-500"
                        />
                        <FormInput
                            label="ราคารวม (บาท)"
                            value={(() => {
                                const packSize = parseFloat(product?.packageSizePerBox || "1");
                                const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                                return (item.quantity * item.unitPrice * multiplier).toLocaleString(
                                    undefined,
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    },
                                );
                            })()}
                            onChange={() => { }}
                            disabled
                            readOnly
                        />
                    </div>

                    {item.priceModified && (
                        <Alert className="bg-yellow-100 border-yellow-300 mt-3">
                            <AlertDescription className="text-sm">
                                ⚠️ ราคาถูกแก้ไขจากราคามาตรฐาน ฿{item.originalPrice.toLocaleString()}
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}
        </div>
    );
}

export default SaleItemRow;
