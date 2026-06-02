"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getProductAction,
  manageProductAction,
} from "@/modules/products/server/actions";
import {
  downloadStockLotTemplateAction,
  parseStockLotsAction,
} from "../../server/import-actions";
import { toast } from "sonner";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
  X,
  Save,
  Download,
  Upload,
} from "lucide-react";
import DatePicker from "@/components/custom/DatePicker";
import type {
  Product,
  ProductManagementFormData,
} from "@/modules/products/types";
import { STORAGE_LOCATION_OPTIONS as storageOptions } from "@/modules/products/types";

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
  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl text-white shadow-lg shadow-red-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 tracking-tight">
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
    className={`bg-white text-gray-800 rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 lg:p-8 transition-all hover:shadow-lg hover:shadow-gray-500/5 hover:border-gray-100 ${className}`}
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
  // Auto-calculate carton price when unit price or package size changes
  useEffect(() => {
    if (formData.price !== undefined && formData.packageSizePerBox) {
      const itemsPerBox = parseInt(formData.packageSizePerBox);
      if (!isNaN(itemsPerBox) && itemsPerBox > 0) {
        setFormData((prev) => ({
          ...prev,
          cartonPrice: (prev.price ?? 0) * itemsPerBox,
        }));
      }
    }
  }, [formData.price, formData.packageSizePerBox, setFormData]);

  return (
    <Card>
      <SectionHeader title="จัดการราคาสินค้า" icon={Banknote} />

      <div className="space-y-6">
        {/* แถวราคา */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ราคาต่อหน่วย */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ราคาต่อหน่วย (บาท)</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={formData.price ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: e.target.value !== "" ? Number(e.target.value) : 0,
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

          {/* จำนวนบรรจุต่อลัง */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              จำนวนบรรจุต่อลัง (ชิ้น)
            </Label>
            <Input
              type="text"
              placeholder="ระบุจำนวน (เช่น 12, 24)"
              value={formData.packageSizePerBox || ""}
              disabled
              className="h-12 text-lg bg-slate-50"
            />
          </div>

          {/* ราคาต่อลัง */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">ราคาต่อลัง (บาท)</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={formData.cartonPrice ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cartonPrice:
                      e.target.value !== "" ? Number(e.target.value) : 0,
                  }))
                }
                disabled={saving}
                className="pl-10 h-12 text-lg font-bold text-green-700"
                onWheel={(e) => e.currentTarget.blur()}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ฿
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              *คำนวณอัตโนมัติจาก ราคาต่อหน่วย × จำนวนบรรจุต่อลัง
            </p>
          </div>
        </div>

        {/* แถวอื่น ๆ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* งบส่งเสริมการขาย */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              งบส่งเสริมการขายต่อลัง (บาท)
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={formData.promotionBudget ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    promotionBudget:
                      e.target.value !== "" ? Number(e.target.value) : 0,
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

          {/* คะแนน */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">คะแนน</Label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={formData.pointPerUnit ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  pointPerUnit: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              disabled={saving}
              className="h-12 text-lg"
              onWheel={(e) => e.currentTarget.blur()}
            />
            <p className="text-xs text-muted-foreground">
              ใช้สำหรับคำนวณคะแนนสะสมของพนักงานต่อสินค้าที่ขายได้
            </p>
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
        i === index ? { ...item, [field]: value } : item,
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
            className="h-9 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 transition-all"
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
                <div className="grid grid-cols-2 gap-4 lg:contents mb-4 lg:mb-0">
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
                          Number(e.target.value),
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:contents gap-4 mb-4 lg:mb-0">
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
                          e.target.value ? Number(e.target.value) : undefined,
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
                    className="h-10 w-10 text-muted-foreground text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/20"
                  >
                    <Trash2 className="h-4 w-4 " />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">ยังไม่มีรายการของแถม</p>
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
        i === index ? { ...item, [field]: value } : item,
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
            className="h-9 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 transition-all"
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
                          Number(e.target.value),
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
                          e.target.value ? Number(e.target.value) : undefined,
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
                    className="h-10 w-10 text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/20"
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
          </div>
        )}
      </div>
    </Card>
  );
};

const StockLotsSection: React.FC<
  SectionProps & { onError: (msg: string) => void }
> = ({ formData, setFormData, saving, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const res = await downloadStockLotTemplateAction();
      if (res.success && res.data) {
        const binary = atob(res.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "template_stock_lot.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("ดาวน์โหลด Template สำเร็จ");
      } else {
        toast.error(res.message || "ไม่สามารถดาวน์โหลดได้");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImporting(true);
      try {
        const fileFormData = new FormData();
        fileFormData.append("file", file);
        const res = await parseStockLotsAction(fileFormData);
        if (res.success && res.data) {
          setFormData((prev) => ({
            ...prev,
            stockLots: [...prev.stockLots, ...res.data],
          }));
          toast.success(`นำเข้าสต็อกสำเร็จ ${res.data.length} รายการ`);
          if (res.errors && res.errors.length > 0) {
            toast.warning(`มีข้อผิดพลาดบางรายการ: ${res.errors.join(", ")}`);
          }
        } else {
          toast.error(res.message || "นำเข้าไม่สำเร็จ");
        }
      } catch (err) {
        toast.error("เกิดข้อผิดพลาดในการอ่านไฟล์");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const addStockLot = () => {
    setFormData((prev) => ({
      ...prev,
      stockLots: [
        ...prev.stockLots,
        {
          lotNumber: "",
          quantity: 1,
          initialQuantity: 1,
          importDate: new Date().toISOString().split("T")[0],
          expiryDate: undefined,
          storageLocation: "คลังบางเลน",
          notes: "",
        },
      ],
    }));
  };

  const removeStockLot = (index: number) => {
    const lot = formData.stockLots[index];
    if (lot.id) {
      onError("ไม่สามารถลบ Lot ที่เพิ่มไปแล้วได้");
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
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const getTotalStock = () => {
    return formData.stockLots.reduce(
      (sum, lot) => sum + (lot.quantity || 0),
      0,
    );
  };

  return (
    <Card>
      <SectionHeader
        title="ข้อมูลสินค้าคงคลัง"
        icon={Package}
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStockLot}
              disabled={saving || importing}
              className="h-9 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 transition-all"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">เพิ่มสต็อกสินค้า</span>
              <span className="sm:hidden">เพิ่ม</span>
            </Button>
          </div>
        }
      />

      <div className="mb-6 flex items-center p-4 bg-gradient-to-r from-green-50 to-green-50 text-green-800 rounded-xl border border-green-100 shadow-sm">
        <div className="p-2 bg-green-100 rounded-lg mr-3">
          <Package className="h-5 w-5 text-green-600" />
        </div>
        <span className="font-medium">จำนวนสินค้าคงหลัง:</span>
        <span className="ml-2 text-2xl font-bold text-green-600">
          {getTotalStock()}
        </span>
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
                  {lot.id
                    ? `${index + 1}. LOT NO. : ${lot.lotNumber}`
                    : `${index + 1}. Lot-${index + 1} (ใหม่)`}
                </span>
                {lot.isUsed && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                    ถูกใช้งานแล้ว
                  </span>
                )}
              </div>
              {!lot.id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStockLot(index)}
                  disabled={saving}
                  className="text-muted-foreground text-destructive bg-destructive/10 hover:text-destructive hover:bg-destructive/20 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Content Form */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  เลขที่ล็อต
                </Label>
                <Input
                  type="text"
                  placeholder={lot.id ? "" : ""}
                  value={lot.lotNumber || ""}
                  onChange={(e) =>
                    updateStockLot(
                      index,
                      "lotNumber",
                      e.target.value.toUpperCase(),
                    )
                  }
                  disabled={saving || !!lot.id}
                  className={`h-10 uppercase ${lot.id ? "bg-muted cursor-not-allowed" : ""}`}
                />
              </div>
              {/* <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  รับเข้า
                </Label>
                <Input
                  type="number"
                  value={lot.initialQuantity ?? lot.quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateStockLot(index, "initialQuantity", val);
                    // If new lot or not used, sync remaining quantity
                    if (!lot.id || !lot.isUsed) {
                      updateStockLot(index, "quantity", val);
                    }
                  }}
                  disabled={saving || !!lot.id}
                  className={`h-10 ${lot.id ? "bg-muted cursor-not-allowed" : ""}`}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div> */}

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">จำนวน</Label>
                <Input
                  type="number"
                  value={lot.quantity}
                  onChange={(e) =>
                    updateStockLot(index, "quantity", Number(e.target.value))
                  }
                  disabled={saving}
                  className="h-10"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  อัพเดทล่าสุด
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
                  สถานที่จัดเก็บ
                </Label>
                <Select
                  value={lot.storageLocation || ""}
                  onValueChange={(value) =>
                    updateStockLot(index, "storageLocation", value)
                  }
                  disabled={saving || !!(lot.id && lot.isUsed)}
                >
                  <SelectTrigger className="!h-10 w-full flex items-center justify-between">
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
              {/* 
              <div className="sm:col-span-2 lg:col-span-5 space-y-1.5">
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
              </div> */}
            </div>
          </div>
        ))}

        {formData.stockLots.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">ยังไม่มีสต็อกสินค้า</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export function ProductManageForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { hasPermission, isLoading: permissionLoading } =
    usePermission("product.manage");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductManagementFormData>({
    price: 0,
    cartonPrice: 0,
    packageSizePerBox: undefined,
    promotionBudget: 0,
    pointPerUnit: undefined,
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
        const res = await getProductAction(productId);
        if (!res.success)
          throw new Error(res.error || "ไม่สามารถโหลดข้อมูลสินค้าได้");
        if (!("product" in res) || !res.product)
          throw new Error("ไม่สามารถโหลดข้อมูลสินค้าได้");
        const productData = res.product;
        setProduct(productData);

        setFormData({
          price: productData.price !== null ? Number(productData.price) : 0,
          cartonPrice: productData.cartonPrice
            ? Number(productData.cartonPrice)
            : 0,
          packageSizePerBox: productData.packageSizePerBox || undefined,
          promotionBudget: productData.promotionBudget
            ? Number(productData.promotionBudget)
            : 0,
          pointPerUnit:
            productData.pointPerUnit !== null
              ? Number(productData.pointPerUnit)
              : undefined,
          freeItems:
            productData.freeItems?.map((item: any) => ({
              id: item.id,
              purchaseQty: item.purchaseQty,
              freeQty: item.freeQty,
              netPrice: item.netPrice ? Number(item.netPrice) : undefined,
              notes: item.notes || "",
            })) || [],
          promotionItems:
            productData.promotionItems?.map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price ? Number(item.price) : undefined,
              notes: item.notes || "",
            })) || [],
          stockLots: (productData.stockLots || [])
            .map((lot: any) => ({
              id: lot.id,
              lotNumber: lot.lotNumber,
              quantity: lot.quantity,
              initialQuantity: lot.initialQuantity ?? lot.quantity,
              importDate: lot.importDate,
              expiryDate: lot.expiryDate || undefined,
              storageLocation: lot.storageLocation || "",
              notes: lot.notes || "",
              isUsed: lot.isUsed,
              createdAt: lot.createdAt,
            }))
            .sort((a: any, b: any) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateA - dateB;
            }),
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
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await manageProductAction(productId, formData);
      if (!res.success) {
        throw new Error(res.error || "เกิดข้อผิดพลาด");
      }

      router.push(`/products`);
      router.refresh();
      // NOTE: Do NOT set saving(false) here.
    } catch (err) {
      console.error("Submit error:", err);
      setError((err as Error).message);
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

  if (error) {
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
      <form
        onSubmit={handleSubmit}
        className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50"
      >
        {/* Modern Red-Gray Gradient Header */}
        <div className="mx-auto px-4 sm:px-6 py-6">
          <div className="relative bg-gradient-to-br from-gray-400 via-gray-400 to-gray-400 rounded-3xl p-[4px] shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 animate-pulse" />
            <div className="relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 backdrop-blur-xl rounded-[22px] p-6 sm:p-8">
              <div className="relative z-10 space-y-5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-red-100 hover:text-white transition-all duration-300 text-sm font-medium w-fit group hover:gap-3 px-3 py-1.5 rounded-lg hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1 group-hover:scale-110" />
                  กลับไปหน้ารายการสินค้า
                </button>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <div className="relative p-5 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                      <Package className="h-9 w-9 sm:h-11 sm:w-11 text-red-600" />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-4">
                    <div className="space-y-1">
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow-md">
                        จัดการสินค้า
                      </h1>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs sm:text-sm border border-white/20 backdrop-blur-md shadow-sm">
                        <Tag className="h-4 w-4 text-yellow-300" />
                        <span className="font-semibold">{product.name}</span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 text-white text-xs sm:text-sm border border-white/10 backdrop-blur-sm">
                        <span className="font-medium text-white">
                          รหัสสินค้า :
                        </span>
                        <span className="font-bold">{product.productCode}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main Content Areas */}
        <div className="mx-auto px-4 sm:px-6 py-8 space-y-8">
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

          {/* Unified Action Buttons (Red-Gray Theme) */}
          <div className="md:col-span-2 pt-8 border-t border-gray-200 mt-8 mb-16 md:mb-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 w-full">
              <Button
                size="lg"
                className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
                type="button"
                onClick={() => router.back()}
                disabled={saving}
              >
                <X className="h-4 w-4" />
                ยกเลิก
              </Button>
              <Button
                size="lg"
                className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    บันทึก
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
