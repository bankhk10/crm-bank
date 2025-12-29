"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Banknote,
  Loader2,
  Package,
  Gift,
  Tag,
  Save,
} from "lucide-react";
import DatePicker from "@/components/custom/DatePicker";
import type { Product, ProductManagementFormData } from "@/types/product";
import { STORAGE_LOCATION_OPTIONS as storageOptions } from "@/types/product";

// ----------------------------------------------------------------------
// Types & Helper Components
// ----------------------------------------------------------------------

interface SectionProps {
  formData: ProductManagementFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductManagementFormData>>;
  saving: boolean;
}

const SectionHeader = ({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold text-foreground tracking-tight">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-card text-card-foreground rounded-xl border shadow-sm p-5 md:p-6 lg:p-8 transition-all hover:shadow-md ${className}`}
  >
    {children}
  </div>
);

// ----------------------------------------------------------------------
// Sub-Components
// ----------------------------------------------------------------------

const PriceManagementSection: React.FC<SectionProps> = ({
  formData,
  setFormData,
  saving,
}) => {
  return (
    <Card>
      <SectionHeader title="จัดการราคาสินค้า" icon={Banknote} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">ราคาสินค้า (บาท)</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={formData.price || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  price: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              disabled={saving}
              className="pl-10 h-12 text-lg"
              onWheel={(e) => e.currentTarget.blur()}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ฿
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">งบส่งเสริมการขาย (บาท)</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.00"
              value={formData.promotionBudget || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  promotionBudget: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              disabled={saving}
              className="pl-10 h-12 text-lg"
              onWheel={(e) => e.currentTarget.blur()}
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ฿
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const FreeItemsSection: React.FC<SectionProps> = ({
  formData,
  setFormData,
  saving,
}) => {
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

  return (
    <Card>
      <SectionHeader
        title="รายการของแถม"
        icon={Gift}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFreeItem}
            disabled={saving}
            className="h-9 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">เพิ่มรายการ</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        }
      />

      <div className="space-y-4">
        {formData.freeItems.length > 0 ? (
          <div className="grid gap-4">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
              <div>ซื้อ (จำนวน)</div>
              <div>แถม (จำนวน)</div>
              <div>ราคาสุทธิ (บาท)</div>
              <div>หมายเหตุ</div>
              <div className="w-10"></div>
            </div>

            {formData.freeItems.map((item, index) => (
              <div
                key={index}
                className="group relative bg-background border rounded-xl p-4 lg:p-2 lg:border-0 lg:bg-transparent lg:grid lg:grid-cols-[1fr_1fr_1fr_1.5fr_auto] gap-4 items-start shadow-sm lg:shadow-none transition-all hover:bg-muted/30"
              >
                {/* Mobile Labels are handled via simple stacking or flex */}
                <div className="grid grid-cols-2 gap-4 lg:block mb-4 lg:mb-0">
                  <div className="space-y-1.5 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      ซื้อ (จำนวน)
                    </Label>
                    <Input
                      type="number"
                      value={item.purchaseQty}
                      onChange={(e) =>
                        updateFreeItem(
                          index,
                          "purchaseQty",
                          Number(e.target.value)
                        )
                      }
                      disabled={saving}
                      className="h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-1.5 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      แถม (จำนวน)
                    </Label>
                    <Input
                      type="number"
                      value={item.freeQty}
                      onChange={(e) =>
                        updateFreeItem(index, "freeQty", Number(e.target.value))
                      }
                      disabled={saving}
                      className="h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:block gap-4 mb-4 lg:mb-0">
                  <div className="space-y-1.5 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      ราคาสุทธิ
                    </Label>
                    <Input
                      type="number"
                      placeholder="ราคาสุทธิ"
                      value={item.netPrice || ""}
                      onChange={(e) =>
                        updateFreeItem(
                          index,
                          "netPrice",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={saving}
                      className="h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  {/* Mobile Notes */}
                  <div className="md:hidden space-y-1.5 ">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      หมายเหตุ
                    </Label>
                    <Input
                      type="text"
                      placeholder="ระบุหมายเหตุ..."
                      value={item.notes || ""}
                      onChange={(e) =>
                        updateFreeItem(index, "notes", e.target.value)
                      }
                      disabled={saving}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Desktop/Tablet Notes */}
                <div className="hidden md:block space-y-1.5 lg:space-y-0">
                  <Label className="lg:hidden text-xs text-muted-foreground">
                    หมายเหตุ
                  </Label>
                  <Input
                    type="text"
                    placeholder="ระบุหมายเหตุ..."
                    value={item.notes || ""}
                    onChange={(e) =>
                      updateFreeItem(index, "notes", e.target.value)
                    }
                    disabled={saving}
                    className="h-10"
                  />
                </div>

                <div className="absolute top-2 right-2 lg:static flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFreeItem(index)}
                    disabled={saving}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">ยังไม่มีรายการของแถม</p>
            <Button
              variant="link"
              onClick={addFreeItem}
              className="mt-2 text-primary"
            >
              + เพิ่มรายการแรก
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const PromotionItemsSection: React.FC<SectionProps> = ({
  formData,
  setFormData,
  saving,
}) => {
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

  return (
    <Card>
      <SectionHeader
        title="รายการส่งเสริมการขาย"
        icon={Tag}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addPromotionItem}
            disabled={saving}
            className="h-9 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">เพิ่มรายการ</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        }
      />

      <div className="space-y-4">
        {formData.promotionItems.length > 0 ? (
          <div className="grid gap-4">
            {/* Desktop Header */}
            <div className="hidden lg:grid grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-4 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
              <div>ชื่อสินค้า</div>
              <div>คงเหลือ</div>
              <div>ราคา (บาท)</div>
              <div>หมายเหตุ</div>
              <div className="w-10"></div>
            </div>

            {formData.promotionItems.map((item, index) => (
              <div
                key={index}
                className="group relative bg-background border rounded-xl p-4 lg:p-2 lg:border-0 lg:bg-transparent lg:grid lg:grid-cols-[1.5fr_1fr_1fr_1.5fr_auto] gap-4 items-start shadow-sm lg:shadow-none transition-all hover:bg-muted/30"
              >
                {/* Mobile/Tablet Stack */}
                <div className="mb-4 lg:mb-0 space-y-1.5 lg:space-y-0">
                  <Label className="lg:hidden text-xs text-muted-foreground">
                    ชื่อสินค้า
                  </Label>
                  <Input
                    type="text"
                    placeholder="ชื่อสินค้า..."
                    value={item.name}
                    onChange={(e) =>
                      updatePromotionItem(index, "name", e.target.value)
                    }
                    disabled={saving}
                    className="h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:contents">
                  <div className="space-y-1.5 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      คงเหลือ
                    </Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updatePromotionItem(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                      disabled={saving}
                      className="h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                  <div className="space-y-1.5 lg:space-y-0">
                    <Label className="lg:hidden text-xs text-muted-foreground">
                      ราคา
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={item.price || ""}
                      onChange={(e) =>
                        updatePromotionItem(
                          index,
                          "price",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      disabled={saving}
                      className="h-10"
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                </div>

                <div className="mt-4 lg:mt-0 space-y-1.5 lg:space-y-0">
                  <Label className="lg:hidden text-xs text-muted-foreground">
                    หมายเหตุ
                  </Label>
                  <Input
                    type="text"
                    placeholder="ระบุหมายเหตุ..."
                    value={item.notes || ""}
                    onChange={(e) =>
                      updatePromotionItem(index, "notes", e.target.value)
                    }
                    disabled={saving}
                    className="h-10"
                  />
                </div>

                <div className="absolute top-2 right-2 lg:static flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePromotionItem(index)}
                    disabled={saving}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              ยังไม่มีรายการส่งเสริมการขาย
            </p>
            <Button
              variant="link"
              onClick={addPromotionItem}
              className="mt-2 text-primary"
            >
              + เพิ่มรายการแรก
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

const StockLotsSection: React.FC<
  SectionProps & { onError: (msg: string) => void }
> = ({ formData, setFormData, saving, onError }) => {
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
      onError("ไม่สามารถลบรายการที่ถูกใช้งานแล้ว");
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

  return (
    <Card>
      <SectionHeader
        title="จัดการสต็อกสินค้า"
        icon={Package}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStockLot}
            disabled={saving}
            className="h-9 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">เพิ่มสต็อกสินค้า</span>
            <span className="sm:hidden">เพิ่ม</span>
          </Button>
        }
      />

      <div className="mb-6 flex items-center p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100">
        <Package className="h-5 w-5 mr-2" />
        <span className="font-medium">ผลรวมจำนวนคงเหลือ:</span>
        <span className="ml-2 text-xl font-bold">{getTotalStock()}</span>
        <span className="ml-1 text-sm opacity-80">หน่วย</span>
      </div>

      <div className="space-y-6">
        {formData.stockLots.map((lot, index) => (
          <div
            key={index}
            className="relative bg-background border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md"
          >
            {/* Header Strip */}
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold px-2 py-1 rounded ${
                    lot.id
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {lot.id ? lot.lotNumber : `Lot-${index + 1} (ใหม่)`}
                </span>
                {lot.isUsed && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    ถูกใช้งานแล้ว
                  </span>
                )}
              </div>
              {!lot.isUsed && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStockLot(index)}
                  disabled={saving}
                  className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content Form */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">จำนวน</Label>
                <Input
                  type="number"
                  value={lot.quantity}
                  onChange={(e) =>
                    updateStockLot(index, "quantity", Number(e.target.value))
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                  className="h-10"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  วันที่นำเข้า
                </Label>
                <div className="h-10">
                  <DatePicker
                    value={lot.importDate}
                    onChange={(v) =>
                      updateStockLot(index, "importDate", v || "")
                    }
                    disabled={saving || !!(lot.id && lot.isUsed)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  วันหมดอายุ
                </Label>
                <div className="h-10">
                  <DatePicker
                    value={lot.expiryDate || undefined}
                    onChange={(v) =>
                      updateStockLot(index, "expiryDate", v || undefined)
                    }
                    disabled={saving || !!(lot.id && lot.isUsed)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  สถานที่จัดเก็บ
                </Label>
                <Select
                  value={lot.storageLocation || ""}
                  onValueChange={(value) =>
                    updateStockLot(index, "storageLocation", value)
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="เลือกสถานที่" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  หมายเหตุ
                </Label>
                <Input
                  type="text"
                  placeholder="หมายเหตุเพิ่มเติม..."
                  value={lot.notes || ""}
                  onChange={(e) =>
                    updateStockLot(index, "notes", e.target.value)
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
        ))}

        {formData.stockLots.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">ยังไม่มีสต็อกสินค้า</p>
            <Button
              variant="link"
              onClick={addStockLot}
              className="mt-2 text-primary"
            >
              + เพิ่มสต็อกแรก
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาด");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/products`);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Submit error:", err);
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  /* ----------------------------------------------------
   * Render States
   * ---------------------------------------------------- */
  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary/80" />
          <p className="text-muted-foreground animate-pulse">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="p-4 max-w-2xl mx-auto mt-10">
        <Alert variant="destructive">
          <AlertDescription>คุณไม่มีสิทธิ์ในการจัดการสินค้า</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="p-4 max-w-2xl mx-auto mt-10 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" /> กลับ
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 max-w-2xl mx-auto mt-10">
        <Alert variant="destructive">
          <AlertDescription>ไม่พบข้อมูลสินค้า</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {success && (
        <Dialog open={true} onOpenChange={(open) => !open && setSuccess(false)}>
          <DialogContent showCloseButton={false} className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  กำลังบันทึกข้อมูล...
                </DialogTitle>
                <DialogDescription className="mt-2 text-center">
                  ระบบกำลังนำคุณกลับไปหน้ารายการสินค้า
                </DialogDescription>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <form
        onSubmit={handleSubmit}
        className="min-h-screen bg-gray-50/50 pb-20"
      >
        {/* Top Header Strip with Gradient */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm backdrop-blur-md bg-white/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="-ml-2 hover:bg-muted"
              >
                <ArrowLeft className="h-5 w-5 text-muted-foreground" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold leading-tight md:text-xl text-foreground">
                  จัดการสินค้า
                </h1>
                <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-md">
                  {product.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Areas */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <PriceManagementSection
            formData={formData}
            setFormData={setFormData}
            saving={saving}
          />

          <FreeItemsSection
            formData={formData}
            setFormData={setFormData}
            saving={saving}
          />

          <PromotionItemsSection
            formData={formData}
            setFormData={setFormData}
            saving={saving}
          />

          <StockLotsSection
            formData={formData}
            setFormData={setFormData}
            saving={saving}
            onError={(msg) => setError(msg)}
          />

          {/* Desktop/Tablet Action Buttons */}
          <div className="hidden sm:flex justify-end gap-4 pt-6 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={saving}
              className="px-8"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> บันทึก...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> บันทึก
                </>
              )}
            </Button>
          </div>

          {/* Bottom Mobile Action Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg flex gap-3 z-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="flex-1"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-primary-foreground"
            >
              {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
