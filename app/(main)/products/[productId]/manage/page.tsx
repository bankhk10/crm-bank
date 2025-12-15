/* --- FULL FILE WITH MODERN UI STYLE --- */

"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/custom/FormInput";
import { FormSelect } from "@/components/custom/FormSelect";
import { ArrowLeft, Plus, Trash2, Banknote } from "lucide-react";
import Link from "next/link";
import type { Product, ProductManagementFormData } from "@/types/product";
import { STORAGE_LOCATION_OPTIONS as storageOptions } from "@/types/product";

export default function ProductManagementPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;
  const { hasPermission, isLoading: permissionLoading } =
    usePermission("product.manage");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<ProductManagementFormData>({
    price: undefined,
    promotionBudget: undefined,
    freeItems: [],
    promotionItems: [],
    stockLots: [],
  });

  /* ----------------------------------------------------
   * Load Product Data
   * ---------------------------------------------------- */
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
        const data = await res.json();
        setProduct(data.product);

        setFormData({
          price: data.product.price ? Number(data.product.price) : undefined,
          promotionBudget: data.product.promotionBudget
            ? Number(data.product.promotionBudget)
            : undefined,
          freeItems:
            data.product.freeItems?.map((item: any) => ({
              id: item.id,
              purchaseQty: item.purchaseQty,
              freeQty: item.freeQty,
              netPrice: item.netPrice ? Number(item.netPrice) : undefined,
              notes: item.notes || "",
            })) || [],
          promotionItems:
            data.product.promotionItems?.map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price ? Number(item.price) : undefined,
              notes: item.notes || "",
            })) || [],
          stockLots:
            data.product.stockLots?.map((lot: any) => ({
              id: lot.id,
              lotNumber: lot.lotNumber,
              quantity: lot.quantity,
              importDate: lot.importDate,
              expiryDate: lot.expiryDate || undefined,
              storageLocation: lot.storageLocation || "",
              notes: lot.notes || "",
              isUsed: lot.isUsed,
            })) || [],
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  /* ----------------------------------------------------
   * Submit
   * ---------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/products/${productId}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/products/${productId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------------------
   * Free items
   * ---------------------------------------------------- */
  const addFreeItem = () => {
    setFormData((prev) => ({
      ...prev,
      freeItems: [
        ...prev.freeItems,
        { purchaseQty: 1, freeQty: 0, netPrice: undefined, notes: "" },
      ],
    }));
  };

  const removeFreeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      freeItems: prev.freeItems.filter((_, i) => i !== index),
    }));
  };

  const updateFreeItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      freeItems: prev.freeItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  /* ----------------------------------------------------
   * Promotion Items
   * ---------------------------------------------------- */
  const addPromotionItem = () => {
    setFormData((prev) => ({
      ...prev,
      promotionItems: [
        ...prev.promotionItems,
        { name: "", quantity: 0, price: undefined, notes: "" },
      ],
    }));
  };

  const removePromotionItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      promotionItems: prev.promotionItems.filter((_, i) => i !== index),
    }));
  };

  const updatePromotionItem = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      promotionItems: prev.promotionItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  /* ----------------------------------------------------
   * Stock Lots
   * ---------------------------------------------------- */
  const addStockLot = () => {
    setFormData((prev) => ({
      ...prev,
      stockLots: [
        ...prev.stockLots,
        {
          lotNumber: "",
          quantity: 1,
          importDate: new Date().toISOString().split("T")[0],
          expiryDate: undefined,
          storageLocation: "",
          notes: "",
        },
      ],
    }));
  };

  const removeStockLot = (index: number) => {
    const lot = formData.stockLots[index];

    if (lot.id && lot.isUsed) {
      setError("ไม่สามารถลบรายการที่ถูกใช้งานแล้ว");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      stockLots: prev.stockLots.filter((_, i) => i !== index),
    }));
  };

  const updateStockLot = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      stockLots: prev.stockLots.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const getTotalStock = () => {
    return formData.stockLots.reduce(
      (sum, lot) => sum + (lot.quantity || 0),
      0
    );
  };

  /* ----------------------------------------------------
   * Loading / No Permission
   * ---------------------------------------------------- */
  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert variant="destructive">
        <AlertDescription>คุณไม่มีสิทธิ์ในการจัดการสินค้า</AlertDescription>
      </Alert>
    );
  }

  if (error && !success) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()}>กลับ</Button>
      </div>
    );
  }

  if (!product) {
    return (
      <Alert variant="destructive">
        <AlertDescription>ไม่พบข้อมูลสินค้า</AlertDescription>
      </Alert>
    );
  }

  /* ----------------------------------------------------
   * MAIN UI
   * ---------------------------------------------------- */

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Page Title */}
      <div className=" bg-white border rounded-xl shadow-sm p-8 space-y-8">
        <h1 className="text-center text-3xl font-bold tracking-tight">จัดการสินค้า</h1>
        <p className="text-muted-foreground text-center">{product.name}</p>

        <div className="bg-white border rounded-xl shadow-sm p-8 space-y-8">
          <h2 className="text-xl font-semibold text-foreground">
            จัดการราคาสินค้า
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="ราคาสินค้า (บาท)"
              type="number"
              value={formData.price || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  price: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              onWheel={(e) => e.currentTarget.blur()}
              leftIcon={<Banknote className="h-5 w-5" />}
              disabled={saving}
            />
            <FormInput
              label="งบส่งเสริมการขาย (บาท)"
              type="number"
              value={formData.promotionBudget || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  promotionBudget: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              onWheel={(e) => e.currentTarget.blur()}
              leftIcon={<Banknote className="h-5 w-5" />}
              disabled={saving}
            />
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">รายการของแถม</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFreeItem}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" /> เพิ่มรายการของแถม
            </Button>
          </div>

          <div className="space-y-4">
            {formData.freeItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-4 border rounded-lg"
              >
                <FormInput
                  label="จำนวนที่ซื้อ"
                  type="number"
                  value={item.purchaseQty}
                  onChange={(e) =>
                    updateFreeItem(index, "purchaseQty", Number(e.target.value))
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving}
                />
                <FormInput
                  label="จำนวนของแถม"
                  type="number"
                  value={item.freeQty}
                  onChange={(e) =>
                    updateFreeItem(index, "freeQty", Number(e.target.value))
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving}
                />
                <FormInput
                  label="ราคาสุทธิ"
                  type="number"
                  value={item.netPrice || ""}
                  onChange={(e) =>
                    updateFreeItem(
                      index,
                      "netPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving}
                />
                <FormInput
                  label="หมายเหตุ"
                  type="text"
                  value={item.notes || ""}
                  onChange={(e) =>
                    updateFreeItem(index, "notes", e.target.value)
                  }
                  disabled={saving}
                />
                <div className="flex justify-end mt-8">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFreeItem(index)}
                    disabled={saving}
                    className="px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {formData.freeItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                ยังไม่มีรายการของแถม
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">รายการส่งเสริมการขาย</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPromotionItem}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" /> เพิ่มรายการส่งเสริมการขาย
            </Button>
          </div>

          <div className="space-y-4">
            {formData.promotionItems.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-4 border rounded-lg"
              >
                <FormInput
                  label="ชื่อสินค้า"
                  type="text"
                  value={item.name}
                  onChange={(e) =>
                    updatePromotionItem(index, "name", e.target.value)
                  }
                  disabled={saving}
                />
                <FormInput
                  label="จำนวนคงเหลือ"
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updatePromotionItem(
                      index,
                      "quantity",
                      Number(e.target.value)
                    )
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving}
                />
                <FormInput
                  label="ราคา"
                  type="number"
                  value={item.price || ""}
                  onChange={(e) =>
                    updatePromotionItem(
                      index,
                      "price",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving}
                />
                <FormInput
                  label="หมายเหตุ"
                  type="text"
                  value={item.notes || ""}
                  onChange={(e) =>
                    updatePromotionItem(index, "notes", e.target.value)
                  }
                  disabled={saving}
                />
                <div className="flex justify-end mt-8">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removePromotionItem(index)}
                    disabled={saving}
                    className="px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {formData.promotionItems.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                ยังไม่มีรายการส่งเสริมการขาย
              </p>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-xl shadow-sm p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">จัดการสต็อกสินค้า</h2>
              <p className="text-sm text-muted-foreground mt-1">
                ผลรวมจำนวนคงเหลือ: {getTotalStock()} หน่วย
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStockLot}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-2" /> เพิ่มสต็อกสินค้า
            </Button>
          </div>

          <div className="space-y-4">
            {formData.stockLots.map((lot, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 p-4 border rounded-lg"
              >
                {lot.id && (
                  <div className="md:col-span-7">
                    <p className="text-sm font-medium text-foreground">
                      {lot.lotNumber}
                      {lot.isUsed && (
                        <span className="ml-2 text-xs text-red-600">
                          (ถูกใช้งานแล้ว)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <FormInput
                  label="จำนวนที่เพิ่ม"
                  type="number"
                  value={lot.quantity}
                  onChange={(e) =>
                    updateStockLot(index, "quantity", Number(e.target.value))
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  disabled={saving || !!(lot.id && lot.isUsed)}
                />

                <div>
                  <label className="text-base font-medium mx-2">วันที่นำเข้า</label>
                  <input
                    type="date"
                    className="mt-1 h-11 text-base w-full rounded-md border border-input bg-background px-3 py-2"
                    value={
                      lot.importDate instanceof Date
                        ? lot.importDate.toISOString().split("T")[0]
                        : lot.importDate
                    }
                    onChange={(e) =>
                      updateStockLot(index, "importDate", e.target.value)
                    }
                    disabled={saving || !!(lot.id && lot.isUsed)}
                  />
                </div>

                <div>
                  <label className="text-base font-medium mx-2">วันหมดอายุ</label>
                  <input
                    type="date"
                    className="mt-1 h-11 text-base w-full rounded-md border border-input bg-background px-3 py-2"
                    value={
                      lot.expiryDate
                        ? lot.expiryDate instanceof Date
                          ? lot.expiryDate.toISOString().split("T")[0]
                          : lot.expiryDate
                        : ""
                    }
                    onChange={(e) =>
                      updateStockLot(
                        index,
                        "expiryDate",
                        e.target.value || undefined
                      )
                    }
                    disabled={saving || !!(lot.id && lot.isUsed)}
                  />
                </div>

                <FormSelect
                  label="สถานที่จัดเก็บ"
                  options={storageOptions}
                  value={lot.storageLocation || ""}
                  onChange={(value) =>
                    updateStockLot(index, "storageLocation", value)
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                />

                <FormInput
                  label="หมายเหตุ"
                  type="text"
                  value={lot.notes || ""}
                  onChange={(e) =>
                    updateStockLot(index, "notes", e.target.value)
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                />

                <div className="flex justify-end mt-8">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeStockLot(index)}
                    disabled={saving || !!(lot.id && lot.isUsed)}
                    className="px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {formData.stockLots.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                ยังไม่มีสต็อกสินค้า
              </p>
            )}
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            ยกเลิก
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </div>
    </form>
  );
}
