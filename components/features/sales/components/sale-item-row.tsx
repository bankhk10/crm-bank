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
import type { SaleItemFormData } from "@/types/sales";
import type { SaleFormProduct } from "../types";

interface SaleItemRowProps {
  item: SaleItemFormData;
  index: number;
  products: SaleFormProduct[];
  onUpdate: (
    index: number,
    field: keyof SaleItemFormData,
    value: unknown
  ) => void;
  onRemove: (index: number) => void;
  onShowDetails: (product: SaleFormProduct) => void;
  fieldError?: string;
  onClearError?: () => void;
}

export function SaleItemRow({
  item,
  index,
  products,
  onUpdate,
  onRemove,
  onShowDetails,
  fieldError,
  onClearError,
}: SaleItemRowProps) {
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
        {/* Product Select */}
        <div className="md:col-span-2 min-w-0">
          <FormCombobox
            label="สินค้า"
            value={item.productId}
            onChange={handleProductChange}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} - ${p.productCode}`,
            }))}
            placeholder="เลือกสินค้า"
            searchPlaceholder="ค้นหาสินค้า..."
            emptyText="ไม่พบสินค้า"
            required
            error={fieldError}
          />
        </div>

        {/* Stock Quantity & Details */}
        {product && (
          <div className="flex items-end justify-between mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onShowDetails(product)}
            >
              <Info className="h-4 w-4 mr-2" />
              รายละเอียด
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
        <FormInput
          label="จำนวน"
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
          label="ราคารวม (บาท)"
          type="number"
          value={String(item.quantity * item.unitPrice)}
          onChange={() => {}}
          disabled
          readOnly
        />
      </div>

      {item.priceModified && (
        <Alert className="bg-yellow-100 border-yellow-300">
          <AlertDescription className="text-sm">
            ⚠️ ราคาถูกแก้ไขจากราคามาตรฐาน ฿{item.originalPrice.toLocaleString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default SaleItemRow;
