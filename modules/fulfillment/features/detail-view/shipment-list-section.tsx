"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  FileDown,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SHIPMENT_STATUS_STYLE } from "../../constants";
import type { ShipmentRecord, RemainingByItem } from "../../types/types";
import {
  updateShipmentAction,
  generateShipmentPdfAction,
} from "../../server/actions";

import { CreateShipmentDialog } from "./create-shipment-dialog";

interface ShipmentListSectionProps {
  saleId: string;
  shipments: ShipmentRecord[];
  remainingByItem: RemainingByItem[];
  shippingCompanies: Array<{ id: string; name: string }>;
  creditDays: number;
  onShipmentUpdated: () => void;
}

function safeFormatDate(date: string | Date | null | undefined, fmt = "d MMM yyyy") {
  if (!date) return "-";
  try {
    const d = new Date(date);
    const year = d.getFullYear() + 543;
    const fmtBE = fmt.replace("yyyy", year.toString());
    return format(d, fmtBE, { locale: th });
  } catch {
    return "-";
  }
}

function ShipmentStatusBadge({ status }: { status: string }) {
  const style =
    SHIPMENT_STATUS_STYLE[status as keyof typeof SHIPMENT_STATUS_STYLE] ||
    SHIPMENT_STATUS_STYLE.PENDING;
  return (
    <Badge className={`${style.className} text-xs font-medium`} variant="outline">
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </Badge>
  );
}

function ShipmentCard({
  shipment,
  remainingByItem,
  shippingCompanies,
  creditDays,
  onUpdated,
}: {
  shipment: ShipmentRecord;
  remainingByItem: RemainingByItem[];
  shippingCompanies: Array<{ id: string; name: string }>;
  creditDays: number;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const payload: Record<string, unknown> = { status: newStatus };
      if (newStatus === "DELIVERED") {
        payload.actualDate = new Date().toISOString();
      }
      const result = await updateShipmentAction(shipment.id, payload);
      if (result.success) {
        toast.success(
          newStatus === "IN_TRANSIT"
            ? "อัพเดทสถานะเป็น ระหว่างขนส่ง แล้ว"
            : newStatus === "DELIVERED"
              ? "ยืนยันการส่งเสร็จแล้ว สต็อกถูกหักแล้ว"
              : "อัพเดทสถานะแล้ว",
        );
        onUpdated();
      } else {
        toast.error(result.error || "เกิดข้อผิดพลาด");
      }
    });
  };

  const handleDownloadPdf = () => {
    startTransition(async () => {
      const result = await generateShipmentPdfAction(shipment.id);
      if (result.success && result.pdfBase64) {
        // Convert base64 to blob and download
        const binary = atob(result.pdfBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ใบจัดส่ง-${shipment.shipmentNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        toast.error(result.error || "ไม่สามารถสร้าง PDF ได้");
      }
    });
  };

  const totalItems = shipment.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = Number(shipment.totalAmount ?? 0);

  return (
    <Card className="border border-border/60 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              #{shipment.shipmentNumber}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                การจัดส่งครั้งที่ {shipment.shipmentNumber}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shipment.shippingCompany?.name || "ไม่ระบุบริษัทขนส่ง"}
                {shipment.salesOrderNumber && ` · เลขที่คำสั่งขาย: ${shipment.salesOrderNumber}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ShipmentStatusBadge status={shipment.status} />
            {totalAmount > 0 && (
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Date info */}
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 rounded-md bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>วันที่จัดส่งของ:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.scheduledDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>ส่งจริง:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.actualDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>วันที่ชำระเงิน:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.paymentDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>ครบกำหนดชำระ:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.dueDate)}
            </span>
          </div>
        </div>

        {/* Items summary */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {shipment.items.length} รายการ · {totalItems} ชิ้น
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                ซ่อน
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                ดูรายการและราคา
              </>
            )}
          </Button>
        </div>

        {/* Items table (collapsible) */}
        {expanded && (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="h-7 text-xs">สินค้า</TableHead>
                  <TableHead className="h-7 text-right text-xs">จำนวน</TableHead>
                  <TableHead className="h-7 text-xs">หน่วย</TableHead>
                  <TableHead className="h-7 text-right text-xs">ราคา/หน่วย</TableHead>
                  <TableHead className="h-7 text-right text-xs">รวม</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipment.items.map((item) => (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="py-1.5">
                      <span className="font-medium">{item.saleItem.productCode}</span>
                      <br />
                      <span className="text-muted-foreground">{item.saleItem.name}</span>
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-semibold">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground">
                      {item.saleItem.unit}
                    </TableCell>
                    <TableCell className="py-1.5 text-right text-muted-foreground">
                      ฿{Number(item.unitPrice ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-1.5 text-right font-semibold text-foreground">
                      ฿{Number(item.totalPrice ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Total row */}
            <div className="flex items-center justify-between border-t bg-muted/20 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {shipment.items.length} รายการ · {totalItems} ชิ้น
              </span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                มูลค่ารวม: ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        {shipment.notes && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            หมายเหตุ: {shipment.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(shipment.status === "PENDING" || shipment.status === "DELIVERED") && (
            <CreateShipmentDialog
              saleId={shipment.saleId}
              shipment={shipment}
              remainingByItem={remainingByItem}
              shippingCompanies={shippingCompanies}
              creditDays={creditDays}
              onCreated={onUpdated}
            />
          )}
          {shipment.status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
              disabled={isPending}
              onClick={() => handleStatusChange("IN_TRANSIT")}
            >
              <Truck className="h-3 w-3" />
              ยืนยันจัดส่ง
            </Button>
          )}
          {shipment.status === "IN_TRANSIT" && (
            <Button
              size="sm"
              className="h-7 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs"
              disabled={isPending}
              onClick={() => handleStatusChange("DELIVERED")}
            >
              <CheckCircle2 className="h-3 w-3" />
              ยืนยันส่งเสร็จแล้ว
            </Button>
          )}
          {(shipment.status === "PENDING" || shipment.status === "IN_TRANSIT") && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-red-200 text-red-600 hover:bg-red-50 text-xs"
              disabled={isPending}
              onClick={() => handleStatusChange("CANCELLED")}
            >
              <XCircle className="h-3 w-3" />
              ยกเลิก
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-7 gap-1.5 text-xs"
            disabled={isPending}
            onClick={handleDownloadPdf}
          >
            <FileDown className="h-3 w-3" />
            PDF ใบจัดส่ง
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ShipmentListSection({
  saleId,
  shipments,
  remainingByItem,
  shippingCompanies,
  creditDays,
  onShipmentUpdated,
}: ShipmentListSectionProps) {
  const hasRemaining = remainingByItem.some((i) => i.remainingQuantity > 0);

  return (
    <div className="space-y-4">
      {/* Remaining quantity summary */}
      {hasRemaining && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900/40 dark:bg-purple-900/10">
          <p className="mb-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
            สินค้าที่ยังค้างจัดส่ง
          </p>
          <div className="space-y-1">
            {remainingByItem
              .filter((i) => i.remainingQuantity > 0)
              .map((item) => (
                <div key={item.saleItemId} className="flex items-center gap-2 text-xs">
                  <ArrowRight className="h-3 w-3 text-purple-500" />
                  <span className="font-medium">{item.productCode}</span>
                  <span className="text-muted-foreground">{item.productName}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    เหลือ {item.remainingQuantity} {item.unit}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Shipment cards */}
      {shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Package className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">ยังไม่มีการจัดส่ง</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1">
          {shipments.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              remainingByItem={remainingByItem}
              shippingCompanies={shippingCompanies}
              creditDays={creditDays}
              onUpdated={onShipmentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
