"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { PlusCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

import type { RemainingByItem } from "../../types/types";
import { createShipmentAction } from "../../server/actions";

const formSchema = z.object({
  scheduledDate: z.string().optional(),
  paymentDate: z.string().optional(),
  dueDate: z.string().optional(),
  salesOrderNumber: z.string().optional(),
  shippingCompanyId: z.string().optional(),
  notes: z.string().optional(),
  quantities: z.record(z.string(), z.coerce.number().int().min(0)),
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
  onCreated: () => void;
  disabled?: boolean;
  creditDays?: number;
}

export function CreateShipmentDialog({
  saleId,
  remainingByItem,
  shippingCompanies,
  onCreated,
  disabled = false,
  creditDays = 0,
}: CreateShipmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const available = remainingByItem.filter((i) => i.remainingQuantity > 0);

  const defaultQuantities = Object.fromEntries(
    available.map((item) => [item.saleItemId, item.remainingQuantity]),
  );

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduledDate: "",
      paymentDate: "",
      dueDate: "",
      salesOrderNumber: "",
      shippingCompanyId: "",
      notes: "",
      quantities: defaultQuantities,
    },
  });

  const scheduledDate = watch("scheduledDate");

  // Auto-calculate dueDate when scheduledDate changes
  useState(() => {
    if (scheduledDate && creditDays > 0) {
      const date = new Date(scheduledDate);
      date.setDate(date.getDate() + creditDays);
      setValue("dueDate", date.toISOString().split("T")[0]);
    }
  });

  // Effect to update dueDate when scheduledDate changes
  const watchedScheduledDate = watch("scheduledDate");
  const watchedPaymentDate = watch("paymentDate");

  useState(() => {
    if (watchedScheduledDate && creditDays >= 0) {
      const date = new Date(watchedScheduledDate);
      date.setDate(date.getDate() + creditDays);
      setValue("dueDate", date.toISOString().split("T")[0]);
    }
  });

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

  const onSubmit = (data: FormValues) => {
    // Build items array — only include items with quantity > 0
    const items = available
      .map((item) => ({
        saleItemId: item.saleItemId,
        quantity: Number(data.quantities[item.saleItemId] ?? 0),
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      toast.error("กรุณาระบุจำนวนสินค้าที่ต้องการส่งอย่างน้อย 1 รายการ");
      return;
    }

    const payload = {
      items,
      scheduledDate: data.scheduledDate || null,
      paymentDate: data.paymentDate || null,
      dueDate: data.dueDate || null,
      salesOrderNumber: data.salesOrderNumber || null,
      shippingCompanyId: data.shippingCompanyId || null,
      notes: data.notes || null,
    };

    startTransition(async () => {
      const result = await createShipmentAction(saleId, payload);
      if (result.success) {
        toast.success("สร้างการจัดส่งใหม่แล้ว");
        setOpen(false);
        reset();
        onCreated();
      } else {
        toast.error(result.error || "ไม่สามารถสร้างการจัดส่งได้");
      }
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!isPending) {
      setOpen(val);
      if (!val) {
        reset({
          scheduledDate: "",
          paymentDate: "",
          dueDate: "",
          salesOrderNumber: "",
          shippingCompanyId: "",
          notes: "",
          quantities: defaultQuantities,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
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
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-purple-600" />
            เพิ่มการจัดส่งใหม่
          </DialogTitle>
          <DialogDescription>
            ระบุสินค้าและจำนวนที่ต้องการส่งในรอบนี้
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Items quantities */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">รายการสินค้าที่จะส่ง</Label>
            <div className="divide-y divide-border rounded-lg border">
              {available.map((item) => (
                <div
                  key={item.saleItemId}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.productCode}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      เหลือได้อีก:{" "}
                      <span className="font-medium text-purple-600">
                        {item.remainingQuantity}
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
                          max={item.remainingQuantity}
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
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              />
              <p className="text-[10px] text-muted-foreground">
                คำนวณจาก วันจัดส่ง + {creditDays} วัน
              </p>
            </div>

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
              />
            </div>
          </div>

          {/* Shipping company */}
          {shippingCompanies.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="shippingCompany" className="text-sm">
                บริษัทขนส่ง
              </Label>
              <Controller
                name="shippingCompanyId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <SelectTrigger id="shippingCompany" className="h-9">
                      <SelectValue placeholder="เลือกบริษัทขนส่ง (ไม่บังคับ)" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

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
            />
          </div>

          <DialogFooter className="gap-2">
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
              className="gap-1.5 bg-purple-600 hover:bg-purple-700"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4" />
              )}
              สร้างการจัดส่ง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
