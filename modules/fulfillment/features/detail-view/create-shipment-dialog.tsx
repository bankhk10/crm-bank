"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusCircle, Loader2, Edit2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormCombobox } from "@/components/custom/form-components";
import { buildCompanyAddress } from "@/lib/address-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { RemainingByItem, ShipmentRecord } from "../../types/types";
import {
  createShipmentAction,
  updateShipmentAction,
  deleteShipmentAction,
} from "../../server/actions";

const DELIVERY_METHODS = [
  { value: "SALES_DELIVERY" as const, label: "พนักงานขาย", icon: "🚚" },
  { value: "FACTORY_DELIVERY" as const, label: "รถโรงงาน", icon: "🏭" },
  { value: "CUSTOMER_PICKUP" as const, label: "รับสินค้าเอง", icon: "🏬" },
  { value: "COURIER" as const, label: "บริษัทขนส่ง", icon: "📦" },
];

const formSchema = z.object({
  scheduledDate: z.string().optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  salesOrderNumber: z.string().optional(),
  shippingCompanyId: z.string().optional(),
  notes: z.string().optional(),
  shippingDiscount: z.coerce.number().min(0).optional(),
  billDiscount: z.coerce.number().min(0).optional(),
  quantities: z.record(z.string(), z.coerce.number().int().min(0)),
  useCustomDeliveryMethod: z.boolean().optional(),
  deliveryMethod: z.string().optional(),
  pickupCompanyId: z.string().optional(),
  shippingAddress: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ShippingCompany {
  id: string;
  name: string;
}

interface CreateShipmentDialogProps {
  saleId: string;
  remainingByItem: RemainingByItem[];
  shippingCompanies: ShippingCompany[];
  customer?: any;
  companies?: any[];
  onCreated: () => void;
  disabled?: boolean;
  creditDays?: number;
  shipment?: ShipmentRecord; // Added for edit mode
}

const toDateInput = (d: string | Date | null | undefined) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0];
};

export function CreateShipmentDialog({
  saleId,
  remainingByItem,
  shippingCompanies,
  onCreated,
  disabled = false,
  creditDays = 0,
  shipment,
  customer,
  companies = [],
}: CreateShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = !!shipment;

  // Items handling
  const shipmentItemsMap = new Map(
    shipment?.items.map((i) => [i.saleItemId, i.quantity]) || [],
  );

  // Filter available items: those with remaining qty OR those already in this shipment (if editing)
  const available = remainingByItem
    .filter(
      (i) => i.remainingQuantity > 0 || shipmentItemsMap.has(i.saleItemId),
    )
    .map((item) => {
      const currentQty = shipmentItemsMap.get(item.saleItemId) || 0;
      return {
        ...item,
        // Max possible is remaining + what's already in this shipment
        maxQuantity: item.remainingQuantity + currentQty,
        currentQty,
      };
    });

  const defaultQuantities = Object.fromEntries(
    available.map((item) => [
      item.saleItemId,
      isEdit ? item.currentQty : item.remainingQuantity,
    ]),
  );

  const { register, handleSubmit, control, reset, setValue, watch, getValues } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        scheduledDate: isEdit ? toDateInput(shipment.scheduledDate) : "",
        paymentDate: isEdit ? toDateInput(shipment.paymentDate) : "",
        dueDate: isEdit ? toDateInput(shipment.dueDate) : "",
        salesOrderNumber: isEdit ? shipment.salesOrderNumber || "" : "",
        shippingCompanyId: isEdit ? shipment.shippingCompanyId || "" : "",
        notes: isEdit ? shipment.notes || "" : "",
        shippingDiscount: isEdit ? Number(shipment.shippingDiscount || 0) : 0,
        billDiscount: isEdit ? Number(shipment.billDiscount || 0) : 0,
        quantities: defaultQuantities,
        useCustomDeliveryMethod: isEdit ? !!shipment.deliveryMethod : false,
        deliveryMethod: isEdit ? shipment.deliveryMethod || "" : "",
        pickupCompanyId: isEdit ? shipment.pickupCompanyId || "" : "",
        shippingAddress: isEdit ? shipment.shippingAddress || "" : "",
      },
    });

  const scheduledDate = watch("scheduledDate");
  const useCustomDeliveryMethod = watch("useCustomDeliveryMethod");
  const deliveryMethod = watch("deliveryMethod");
  const pickupCompanyId = watch("pickupCompanyId");
  const shippingAddress = watch("shippingAddress");

  // Better way to handle effect in react-hook-form
  const onScheduledDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue("scheduledDate", val);
    if (val && creditDays >= 0) {
      const date = new Date(val);
      date.setDate(date.getDate() + creditDays);
      setValue("dueDate", date.toISOString().split("T")[0]);
    }
  };

  const isDelivered =
    shipment?.status === "DELIVERED" || shipment?.status === "COMPLETED";
  const isCompleted = shipment?.status === "COMPLETED";

  const onSubmit = (data: FormValues) => {
    // Build items array — only include items with quantity > 0
    // Skip items if already delivered to avoid unnecessary updates
    const items = isDelivered
      ? undefined
      : available
          .map((item) => ({
            saleItemId: item.saleItemId,
            quantity: Number(data.quantities[item.saleItemId] ?? 0),
          }))
          .filter((item) => item.quantity > 0);

    if (!isDelivered && (!items || items.length === 0)) {
      toast.error("กรุณาระบุจำนวนสินค้าที่ต้องการส่งอย่างน้อย 1 รายการ");
      return;
    }

    const formShippingCompanyId =
      data.shippingCompanyId || getValues("shippingCompanyId");
    const formPickupCompanyId =
      data.pickupCompanyId || getValues("pickupCompanyId");
    const formDeliveryMethod =
      data.deliveryMethod || getValues("deliveryMethod");
    const formUseCustomDeliveryMethod =
      data.useCustomDeliveryMethod ?? getValues("useCustomDeliveryMethod");

    const payload = {
      items,
      scheduledDate: data.scheduledDate || null,
      paymentDate: data.paymentDate || null,
      dueDate: data.dueDate || null,
      salesOrderNumber: data.salesOrderNumber || null,
      shippingCompanyId: isDelivered
        ? undefined
        : formShippingCompanyId || null,
      shippingCompanyName: isDelivered
        ? undefined
        : (formShippingCompanyId &&
            (shippingCompanies?.find((c) => c.id === formShippingCompanyId)
              ?.name ||
              customer?.shippingCompanies?.find(
                (sc: any) => sc.shippingCompany.id === formShippingCompanyId,
              )?.shippingCompany?.name)) ||
          null,
      notes: data.notes || null,
      shippingDiscount: data.shippingDiscount || 0,
      billDiscount: data.billDiscount || 0,
      useCustomDeliveryMethod: formUseCustomDeliveryMethod,
      deliveryMethod: formDeliveryMethod,
      pickupCompanyId: formPickupCompanyId || null,
      pickupCompanyName:
        (formPickupCompanyId &&
          companies?.find((c) => c.id === formPickupCompanyId)?.name) ||
        null,
      shippingAddress: data.shippingAddress || null,
    };

    startTransition(async () => {
      const result = isEdit
        ? await updateShipmentAction(shipment.id, payload)
        : await createShipmentAction(saleId, payload);

      if (result.success) {
        toast.success(isEdit ? "แก้ไขการจัดส่งแล้ว" : "สร้างการจัดส่งใหม่แล้ว");
        setOpen(false);
        if (!isEdit) reset();
        onCreated();
      } else {
        toast.error(result.error || "ไม่สามารถดำเนินการได้");
      }
    });
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (!shipment) return;
    startTransition(async () => {
      const result = await deleteShipmentAction(shipment.id);
      if (result.success) {
        toast.success("ลบการจัดส่งแล้ว");
        setShowDeleteConfirm(false);
        setOpen(false);
        onCreated();
      } else {
        toast.error(result.error || "ไม่สามารถลบการจัดส่งได้");
      }
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!isPending) {
      setOpen(val);
      if (!val && !isEdit) {
        reset({
          scheduledDate: "",
          paymentDate: "",
          dueDate: "",
          salesOrderNumber: "",
          shippingCompanyId: "",
          notes: "",
          shippingDiscount: 0,
          billDiscount: 0,
          quantities: defaultQuantities,
          useCustomDeliveryMethod: false,
          deliveryMethod: "",
          pickupCompanyId: "",
          shippingAddress: "",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 text-xs"
            disabled={disabled || isCompleted}
          >
            <Edit2 className="h-3 w-3" />
            แก้ไข
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || available.length === 0}
            className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900/20"
            id="create-shipment-trigger"
          >
            <PlusCircle className="h-4 w-4" />
            เพิ่มการจัดส่งใหม่
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-[120vw] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <Edit2 className="h-5 w-5 text-amber-600" />
            ) : (
              <PlusCircle className="h-5 w-5 text-purple-600" />
            )}
            {isEdit
              ? `แก้ไขการจัดส่งครั้งที่ ${shipment.shipmentNumber}`
              : "เพิ่มการจัดส่งใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "แก้ไขข้อมูลและจำนวนสินค้าสำหรับการจัดส่งนี้"
              : "ระบุสินค้าและจำนวนที่ต้องการส่งในรอบนี้"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Items quantities */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              รายการสินค้าที่จะส่ง
            </Label>
            <div className="divide-y divide-border rounded-lg border">
              {available.map((item) => (
                <div
                  key={item.saleItemId}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.productName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.productCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      จำนวนที่ส่งได้:{" "}
                      <span className="font-medium text-purple-600">
                        {item.maxQuantity}
                      </span>{" "}
                      {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Controller
                      name={`quantities.${item.saleItemId}`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          value={field.value ?? 0}
                          type="number"
                          min={0}
                          max={item.maxQuantity}
                          disabled={isDelivered}
                          className="h-8 w-20 text-right text-sm"
                          id={`qty-${item.saleItemId}`}
                        />
                      )}
                    />
                    <span className="w-10 text-xs text-muted-foreground">
                      {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Shipping date (Scheduled date) */}
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate" className="text-sm">
                วันที่จัดส่งของ
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                className="h-9"
                {...register("scheduledDate")}
                onChange={onScheduledDateChange}
                disabled={isCompleted}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-sm">
                วันครบกำหนดชำระ
              </Label>
              <Input
                id="dueDate"
                type="date"
                className="h-9"
                {...register("dueDate")}
                disabled={isCompleted}
              />
              <p className="text-[10px] text-muted-foreground">
                คำนวณจาก วันจัดส่ง + {creditDays} วัน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Shipping Discount */}
            <div className="space-y-1.5">
              <Label htmlFor="shippingDiscount" className="text-sm">
                ส่วนลดค่าขนส่ง (บาท)
              </Label>
              <Input
                id="shippingDiscount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-9"
                {...register("shippingDiscount")}
              />
            </div>

            {/* Bill Discount */}
            <div className="space-y-1.5">
              <Label htmlFor="billDiscount" className="text-sm">
                ส่วนลดหน้าบิล (บาท)
              </Label>
              <Input
                id="billDiscount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-9"
                {...register("billDiscount")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sales Order Number */}
            <div className="space-y-1.5">
              <Label htmlFor="salesOrderNumber" className="text-sm">
                เลขที่คำสั่งขาย
              </Label>
              <Input
                id="salesOrderNumber"
                placeholder="เช่น SO-2024-001"
                className="h-9"
                {...register("salesOrderNumber")}
                disabled={isCompleted}
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate" className="text-sm">
                วันที่ชำระเงิน
              </Label>
              <Input
                id="paymentDate"
                type="date"
                className="h-9"
                {...register("paymentDate")}
                disabled={isCompleted}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
            <div className="flex items-center space-x-2">
              <Controller
                name="useCustomDeliveryMethod"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="useCustomDeliveryMethod"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isCompleted}
                  />
                )}
              />
              <Label
                htmlFor="useCustomDeliveryMethod"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                ต้องการเปลี่ยนวิธีการจัดส่ง
              </Label>
            </div>

            {useCustomDeliveryMethod && (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {DELIVERY_METHODS.map((method) => (
                    <div
                      key={method.value}
                      onClick={() => {
                        if (isCompleted) return;
                        setValue("deliveryMethod", method.value);
                        if (method.value !== "CUSTOMER_PICKUP") {
                          setValue("pickupCompanyId", "");
                        }
                        if (method.value !== "COURIER") {
                          setValue("shippingCompanyId", "");
                          setValue("shippingAddress", "");
                        }
                      }}
                      className={`group relative cursor-pointer rounded-xl border p-2.5 transition-all
                        ${
                          deliveryMethod === method.value
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-blue-300"
                        } ${isCompleted ? "opacity-70 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value={method.value}
                          checked={deliveryMethod === method.value}
                          onChange={(e) => {
                            if (isCompleted) return;
                            setValue("deliveryMethod", e.target.value);
                          }}
                          disabled={isCompleted}
                          className="h-3.5 w-3.5 text-blue-600"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg leading-none">
                            {method.icon}
                          </span>
                          <span className="text-xs font-medium text-gray-900 leading-tight">
                            {method.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Specific Fields based on method */}
                {deliveryMethod === "CUSTOMER_PICKUP" && (
                  <div className="mt-3 space-y-3 rounded-lg border bg-white p-3">
                    <FormCombobox
                      id="pickupCompanyId"
                      label="สถานที่รับสินค้า (บริษัท/สาขา)"
                      value={pickupCompanyId || ""}
                      onChange={(val) => {
                        setValue("pickupCompanyId", val);
                        const selectedCompany = companies?.find(
                          (c) => c.id === val,
                        );
                        if (selectedCompany) {
                          const structuredAddr = buildCompanyAddress({
                            addressLine:
                              selectedCompany.addressLine || undefined,
                            subdistrict:
                              selectedCompany.subdistrict || undefined,
                            district: selectedCompany.district || undefined,
                            province: selectedCompany.province || undefined,
                            postalCode: selectedCompany.postalCode || undefined,
                          });
                          const fullAddress =
                            structuredAddr || selectedCompany.address || "";
                          setValue("shippingAddress", fullAddress);
                        } else {
                          setValue("shippingAddress", "");
                        }
                      }}
                      options={
                        companies?.map((c) => ({
                          value: c.id,
                          label: c.name,
                        })) || []
                      }
                      placeholder="เลือกสถานที่รับสินค้า"
                      searchPlaceholder="ค้นหาสถานที่..."
                      emptyText="ไม่พบสถานที่"
                      disabled={isCompleted}
                      containerClassName="min-w-0"
                    />

                    <div className="min-w-0">
                      <Label className="mb-1.5 block text-xs font-medium">
                        ที่อยู่สถานที่รับสินค้า
                      </Label>
                      <div className="flex min-h-[36px] items-center rounded-md border bg-gray-50 px-3 text-sm text-gray-700">
                        <span className="block w-full truncate">
                          {shippingAddress || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {deliveryMethod === "COURIER" && (
                  <div className="mt-3 space-y-3 rounded-lg border bg-white p-3">
                    {customer?.shippingCompanies &&
                    customer.shippingCompanies.length > 0 ? (
                      <>
                        <FormCombobox
                          id="shippingCompanyId"
                          label="เลือกบริษัทขนส่ง"
                          value={watch("shippingCompanyId") || ""}
                          onChange={(val) => {
                            setValue("shippingCompanyId", val);
                            const selected = customer.shippingCompanies?.find(
                              (sc: any) => sc.shippingCompany.id === val,
                            );
                            const sc = selected?.shippingCompany;
                            if (sc) {
                              const structuredAddr = buildCompanyAddress({
                                addressLine: sc.addressLine || undefined,
                                subdistrict: sc.subdistrict || undefined,
                                district: sc.district || undefined,
                                province: sc.province || undefined,
                                postalCode: sc.postalCode || undefined,
                              });
                              const fullAddress =
                                structuredAddr || sc.address || "";
                              setValue("shippingAddress", fullAddress);
                            } else {
                              setValue("shippingAddress", "");
                            }
                          }}
                          options={customer.shippingCompanies.map(
                            (sc: any) => ({
                              value: sc.shippingCompany.id,
                              label: sc.shippingCompany.name,
                            }),
                          )}
                          placeholder="เลือกบริษัทขนส่ง"
                          searchPlaceholder="ค้นหาบริษัทขนส่ง..."
                          emptyText="ไม่พบข้อมูลบริษัทขนส่ง"
                          disabled={isCompleted}
                          containerClassName="min-w-0"
                        />

                        {watch("shippingCompanyId") && (
                          <div className="min-w-0">
                            <Label className="mb-1.5 block text-xs font-medium">
                              ที่อยู่สำหรับส่งให้บริษัทขนส่ง
                            </Label>
                            <div className="flex min-h-[36px] items-center rounded-md border bg-gray-50 px-3 text-sm text-gray-700">
                              <span className="block w-full truncate">
                                {shippingAddress || "-"}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-center text-sm text-red-600 py-2">
                        ไม่มีข้อมูลบริษัทขนส่งที่เชื่อมโยงกับลูกค้ารายนี้
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">
              หมายเหตุ
            </Label>
            <Textarea
              id="notes"
              placeholder="หมายเหตุสำหรับการจัดส่งนี้..."
              rows={2}
              className="resize-none text-sm"
              {...register("notes")}
              disabled={isCompleted}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between w-full">
            <div className="flex-1">
              {isEdit && shipment.status === "PENDING" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  ลบการจัดส่ง
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className={`gap-1.5 ${isEdit ? "bg-amber-600 hover:bg-amber-700" : "bg-purple-600 hover:bg-purple-700"}`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  <Edit2 className="h-4 w-4" />
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                {isEdit ? "บันทึกการแก้ไข" : "สร้างการจัดส่ง"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="border-red-100 dark:border-red-900/30">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle>ยืนยันการลบการจัดส่ง</AlertDialogTitle>
                <AlertDialogDescription>
                  คุณต้องการลบการจัดส่งครั้งที่ {shipment?.shipmentNumber}{" "}
                  ใช่หรือไม่?
                </AlertDialogDescription>
              </div>
            </div>
            <div className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
              ข้อมูลการจัดส่งและรายการสินค้าในรอบนี้จะถูกลบออกถาวร
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                executeDelete();
              }}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              ยืนยันการลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
