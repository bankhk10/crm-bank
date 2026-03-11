import { db } from "@/lib/db";
import { Prisma, SalesTargetChangeType } from "@prisma/client";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SalesTargetSnapshot {
  year: number;
  month: number;
  employeeId: string;
  employeeName?: string;
  stores: {
    customerId: string;
    customerName?: string;
    customerCode?: string;
    items: {
      productId: string;
      productName?: string;
      productCode?: string;
      pricePerBox: number;
      qtyPerBox: number;
      targetAmount: number;
    }[];
  }[];
}

// ─────────────────────────────────────────────
// Repository Functions
// ─────────────────────────────────────────────

/**
 * สร้าง snapshot จาก SalesTarget ที่ดึงมาด้วย include ครบแล้ว
 */
export function buildSnapshot(target: any): SalesTargetSnapshot {
  return {
    year: target.year,
    month: target.month,
    employeeId: target.employeeId,
    employeeName: target.employee?.name,
    stores: (target.stores ?? []).map((store: any) => ({
      customerId: store.customerId,
      customerName: store.customer?.name,
      customerCode: store.customer?.customerCode,
      items: (store.items ?? []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name,
        productCode: item.product?.productCode,
        pricePerBox: Number(item.pricePerBox),
        qtyPerBox: Number(item.qtyPerBox),
        targetAmount: Number(item.targetAmount),
      })),
    })),
  };
}

/**
 * สร้างข้อความสรุปการเปลี่ยนแปลง เพื่อแสดงใน UI
 */
export function buildChangeSummary(
  changeType: SalesTargetChangeType,
  before?: SalesTargetSnapshot | null,
  after?: SalesTargetSnapshot | null,
): string {
  if (changeType === "CREATED") {
    const storeCount = after?.stores?.length ?? 0;
    const itemCount =
      after?.stores?.reduce((sum, s) => sum + s.items.length, 0) ?? 0;
    return `สร้างเป้าหมายใหม่ ${storeCount} ร้านค้า ${itemCount} สินค้า`;
  }

  if (changeType === "DELETED") {
    const storeCount = before?.stores?.length ?? 0;
    return `ลบเป้าหมาย ${storeCount} ร้านค้า`;
  }

  // UPDATED — คำนวณความต่างคร่าวๆ
  const beforeStores = before?.stores?.length ?? 0;
  const afterStores = after?.stores?.length ?? 0;
  const beforeItems =
    before?.stores?.reduce((sum, s) => sum + s.items.length, 0) ?? 0;
  const afterItems =
    after?.stores?.reduce((sum, s) => sum + s.items.length, 0) ?? 0;

  const parts: string[] = [];
  if (beforeStores !== afterStores) {
    const diff = afterStores - beforeStores;
    parts.push(`${diff > 0 ? "เพิ่ม" : "ลด"}ร้านค้า ${Math.abs(diff)} แห่ง`);
  }
  if (beforeItems !== afterItems) {
    const diff = afterItems - beforeItems;
    parts.push(
      `${diff > 0 ? "เพิ่ม" : "ลด"}สินค้า ${Math.abs(diff)} รายการ`,
    );
  }
  if (parts.length === 0) parts.push("แก้ไขรายการสินค้า");
  return parts.join(", ");
}

/**
 * บันทึกประวัติการเปลี่ยนแปลง
 */
export async function recordSalesTargetHistory(params: {
  salesTargetId: string;
  changeType: SalesTargetChangeType;
  changedById: string;
  snapshotBefore?: SalesTargetSnapshot | null;
  snapshotAfter?: SalesTargetSnapshot | null;
  changeSummary?: string;
}) {
  const {
    salesTargetId,
    changeType,
    changedById,
    snapshotBefore,
    snapshotAfter,
    changeSummary,
  } = params;

  const summary =
    changeSummary ??
    buildChangeSummary(changeType, snapshotBefore, snapshotAfter);

  return db.salesTargetHistory.create({
    data: {
      salesTargetId,
      changeType,
      changedById,
      // Prisma nullable Json fields use Prisma.JsonNull to store null,
      // or the actual value cast as InputJsonValue
      snapshotBefore:
        snapshotBefore != null
          ? (snapshotBefore as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      snapshotAfter:
        snapshotAfter != null
          ? (snapshotAfter as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      changeSummary: summary,
    },
  });
}

/**
 * ดึงประวัติทั้งหมดของ SalesTarget โดย ID
 */
export async function findSalesTargetHistory(salesTargetId: string) {
  return db.salesTargetHistory.findMany({
    where: { salesTargetId },
    include: {
      changedBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { changedAt: "desc" },
  });
}
