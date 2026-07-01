"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  FileDown,
  ArrowRight,
  LayoutList,
  MapPin,
  Package,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  companies: any[];
  customer: any;
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
  companies,
  customer,
  creditDays,
  onUpdated,
}: {
  shipment: ShipmentRecord;
  remainingByItem: RemainingByItem[];
  shippingCompanies: Array<{ id: string; name: string }>;
  companies: any[];
  customer: any;
  creditDays: number;
  onUpdated: () => void;
}) {
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
            ? "ยืนยันจัดส่งแล้ว ตัดสต็อกและนับ Invoice เรียบร้อย"
            : newStatus === "DELIVERED"
              ? "ยืนยันส่งเสร็จแล้ว บันทึก actualDate เรียบร้อย"
              : newStatus === "CANCELLED"
                ? "ยกเลิกการจัดส่งเรียบร้อย"
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
              {shipment.shipmentNumber}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                การจัดส่งครั้งที่ {shipment.shipmentNumber}
              </CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shipment.salesOrderNumber && `เลขที่คำสั่งขาย: ${shipment.salesOrderNumber}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ShipmentStatusBadge status={shipment.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Date info */}
        <div className="grid grid-cols-3 gap-y-2 gap-x-4 rounded-md bg-muted/30 p-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>วันที่จัดส่งของ:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.scheduledDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>ครบกำหนดชำระ:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.dueDate)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>วันที่ชำระเงิน:</span>
            <span className="font-medium text-foreground">
              {safeFormatDate(shipment.paymentDate)}
            </span>
          </div>
        </div>

        {/* Delivery Method Info */}
        {shipment.deliveryMethod && (
          <div className="rounded-md bg-blue-50/50 p-3 text-xs border border-blue-100">
            <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1.5">
              <Truck className="h-3.5 w-3.5" />
              <span>วิธีจัดส่งแบบกำหนดเอง: {shipment.deliveryMethod === "CUSTOMER_PICKUP" ? "ลูกค้ามารับสินค้าเอง" : shipment.deliveryMethod === "COURIER" ? "ส่งโดยบริษัทขนส่ง" : shipment.deliveryMethod === "SALES_DELIVERY" ? "พนักงานขายจัดส่งสินค้า" : shipment.deliveryMethod === "FACTORY_DELIVERY" ? "ส่งโดยรถโรงงาน" : shipment.deliveryMethod}</span>
            </div>
            {shipment.shippingAddress && (
              <div className="flex items-start gap-1.5 text-muted-foreground mt-1 text-[11px]">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{shipment.shippingAddress}</span>
              </div>
            )}
            {shipment.shippingCompanyId && shipment.deliveryMethod === "COURIER" && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1 text-[11px] ml-4.5">
                <span>บ.ขนส่ง: {shippingCompanies.find(c => c.id === shipment.shippingCompanyId)?.name || shipment.shippingCompanyId}</span>
              </div>
            )}
          </div>
        )}

        {/* Items table */}
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="h-7 text-xs">สินค้า</TableHead>
                <TableHead className="h-7 text-center text-xs">จำนวน</TableHead>
                <TableHead className="h-7 text-center text-xs">หน่วย</TableHead>
                <TableHead className="h-7 text-center text-xs">บรรจุ</TableHead>
                <TableHead className="h-7 text-center text-xs">ราคา/หน่วย</TableHead>
                <TableHead className="h-7 text-center text-xs">ราคา/ลัง</TableHead>
                <TableHead className="h-7 text-center text-xs">งบ/ลัง</TableHead>
                <TableHead className="h-7 text-center text-xs">ราคารวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipment.items.map((item) => {
                const qty = item.quantity;
                const unitPrice = Number(item.unitPrice ?? 0);
                const packSize = parseFloat(
                  item.saleItem.packageSizePerBox?.toString() || "1"
                );
                const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                const cartonPrice = unitPrice * multiplier;
                const promotionBudget = Number(item.saleItem.promotionBudget ?? 0);
                // ราคารวม = จำนวน × ราคา/ลัง
                const totalByCarton = qty * cartonPrice;

                return (
                  <TableRow key={item.id} className="text-xs">
                    <TableCell className="py-1.5">
                      <span className="font-medium">{item.saleItem.name}</span>
                      <br />
                      <span className="text-muted-foreground">{item.saleItem.productCode}</span>
                    </TableCell>
                    <TableCell className="py-1.5 text-center">{qty}</TableCell>
                    <TableCell className="py-1.5 text-center text-muted-foreground">
                      {item.saleItem.unit}
                    </TableCell>
                    <TableCell className="py-1.5 text-center text-muted-foreground">
                      {item.saleItem.packageSizePerBox ?? "-"}
                    </TableCell>
                    <TableCell className="py-1.5 text-center text-muted-foreground">
                      ฿{unitPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-semibold text-foreground">
                      ฿{cartonPrice.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      {promotionBudget > 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          ฿{promotionBudget.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-semibold text-purple-700 dark:text-purple-300">
                      ฿{totalByCarton.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {/* Total row and Discounts */}
          <div className="border-t bg-muted/20 px-3 py-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>มูลค่ารวมสินค้า:</span>
              <span>
                ฿{(() => {
                  const subtotal = shipment.items.reduce((sum, item) => {
                    const unitPrice = Number(item.unitPrice ?? 0);
                    const packSize = parseFloat(item.saleItem.packageSizePerBox?.toString() || "1");
                    const multiplier = isNaN(packSize) || packSize <= 0 ? 1 : packSize;
                    return sum + item.quantity * unitPrice * multiplier;
                  }, 0);
                  return subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 });
                })()}
              </span>
            </div>

            {Number(shipment.shippingDiscount || 0) > 0 && (
              <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                <span>ส่วนลดค่าขนส่ง:</span>
                <span>-฿{Number(shipment.shippingDiscount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {Number(shipment.billDiscount || 0) > 0 && (
              <div className="flex items-center justify-between text-xs text-red-600 dark:text-red-400">
                <span>ส่วนลดหน้าบิล:</span>
                <span>-฿{Number(shipment.billDiscount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-muted-foreground/20 pt-1.5">
              <span className="text-xs text-muted-foreground">
                {shipment.items.length} รายการ · {totalItems} ชิ้น
              </span>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                ยอดสุทธิ: ฿{totalAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {shipment.notes && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            หมายเหตุ: {shipment.notes}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {(shipment.status === "PENDING" || shipment.status === "DELIVERED" || shipment.status === "COMPLETED") && (
            <CreateShipmentDialog
              saleId={shipment.saleId}
              shipment={shipment}
              remainingByItem={remainingByItem}
              shippingCompanies={shippingCompanies}
              companies={companies}
              customer={customer}
              creditDays={creditDays}
              onCreated={onUpdated}
            />
          )}
          {shipment.status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs"
              disabled={isPending || !shipment.scheduledDate}
              onClick={() => handleStatusChange("IN_TRANSIT")}
            >
              <Truck className="h-3 w-3" />
              ยืนยันจัดส่ง (ตัดสต็อก)
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
          {shipment.status !== "CANCELLED" && (() => {
            const isStockDeducted = ["IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(shipment.status);
            const msg = isStockDeducted 
              ? "ต้องการยกเลิกการจัดส่งนี้และคืนสต็อกสินค้าใช่หรือไม่?" 
              : "ต้องการยกเลิกการจัดส่งนี้ใช่หรือไม่?";
            const title = isStockDeducted ? "ยืนยันการยกเลิกและคืนสต็อก" : "ยืนยันการยกเลิกการจัดส่ง";
            
            return (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
                    disabled={isPending}
                  >
                    <XCircle className="h-3 w-3" />
                    {isStockDeducted ? "ยกเลิกและคืนสต็อก" : "ยกเลิกการจัดส่ง"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-rose-100 shadow-xl shadow-rose-900/5">
                  <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-rose-600 flex items-center gap-2 text-lg">
                      <XCircle className="h-5 w-5" />
                      {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 text-sm font-medium leading-relaxed">
                      {msg}
                      {isStockDeducted && <span className="block mt-1.5 text-rose-600/80 font-normal">ระบบจะคืนสต็อกสินค้ากลับเข้าสู่คลังโดยอัตโนมัติ</span>}
                      <span className="block mt-2 text-xs text-gray-400 font-normal">คุณไม่สามารถย้อนกลับการกระทำนี้ได้</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-6 border-t border-gray-100 pt-4">
                    <AlertDialogCancel className="h-10 rounded-xl hover:bg-gray-100">ปิด</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleStatusChange("CANCELLED")}
                      className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20"
                    >
                      ยืนยันการยกเลิก
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })()}
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 text-xs"
              disabled={isPending}
              asChild
            >
              <Link href={`/fulfillment/shipments/${shipment.id}/detail?saleId=${shipment.saleId}`}>
                <LayoutList className="h-3 w-3" />
                ดู PDF
              </Link>
            </Button>
          </div>
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
  companies,
  customer,
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
              companies={companies}
              customer={customer}
              creditDays={creditDays}
              onUpdated={onShipmentUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
