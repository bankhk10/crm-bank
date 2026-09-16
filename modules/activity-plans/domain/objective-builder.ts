/**
 * Domain Layer: Pure TypeScript Auto Objective Builder
 *
 * Rules:
 * - NO imports of Prisma / @prisma/client
 * - NO database queries
 * - Client-safe, zero server-only dependencies
 * - Fully unit testable
 */

const CODE_TO_NAME: Record<string, string> = {
  TYPE_1: "เข้าพบร้านค้า / Key Farmer",
  TYPE_2: "ติดตามผลการใช้สินค้า",
  TYPE_3: "เสนอขายสินค้า",
  TYPE_4: "วางบิล / เก็บเงิน",
  TYPE_5: "สำรวจตลาดคู่แข่ง",
  TYPE_6: "ตรวจสอบเรื่องร้องเรียน / แก้ปัญหา",
  TYPE_7: "ติดตามแปลงสาธิต / ทำแปลง",
  TYPE_8: "จัดประชุมการเกษตร",
  TYPE_9: "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  TYPE_10: "จัดงาน Field Day",
  TYPE_11: "ตรวจเช็กสต็อกหน้าร้าน",
  TYPE_12: "ทัวร์",
};

export interface ObjectiveBuilderInput {
  workTypeNames?: string[];
  workTypeCodes?: string[];
  storeNames?: string[];
  stores?: Array<{
    storeName?: string | null;
    workTypeCode?: string | null;
    [key: string]: unknown;
  }>;
  productNames?: string[];
  products?: Array<{
    productName?: string | null;
    workTypeCode?: string | null;
    [key: string]: unknown;
  }>;
  province?: string | null;
  location?: string | null;
}

/**
 * Generate a concise, meaningful Activity Plan objective based on normalized domain entities.
 */
export function buildActivityObjective(input: ObjectiveBuilderInput): string {
  const parts: string[] = [];

  const types = [
    ...(input.workTypeNames || []),
    ...(input.workTypeCodes || []).map((code) => CODE_TO_NAME[code] || code),
  ].filter(Boolean);

  const uniqueTypes = Array.from(new Set(types));
  if (uniqueTypes.length > 0) {
    parts.push(uniqueTypes.map((t) => `[${t}]`).join(" "));
  }

  const stores = Array.from(
    new Set(
      [
        ...(input.storeNames || []),
        ...(input.stores || []).map((s) => s.storeName || ""),
      ].filter(Boolean),
    ),
  );

  if (stores.length > 0) {
    if (stores.length <= 2) {
      parts.push(`ณ ร้าน ${stores.join(", ")}`);
    } else {
      parts.push(
        `ณ ร้าน ${stores.slice(0, 2).join(", ")} และอีก ${stores.length - 2} ร้าน`,
      );
    }
  } else if (input.location) {
    parts.push(`ณ ${input.location}`);
  } else if (input.province) {
    parts.push(`พื้นที่ จ.${input.province}`);
  }

  const products = Array.from(
    new Set(
      [
        ...(input.productNames || []),
        ...(input.products || []).map((p) => p.productName || ""),
      ].filter(Boolean),
    ),
  );

  if (products.length > 0) {
    if (products.length <= 2) {
      parts.push(`(สินค้า: ${products.join(", ")})`);
    } else {
      parts.push(`(สินค้า: ${products.slice(0, 2).join(", ")} และอื่นๆ)`);
    }
  }

  return parts.join(" ") || "ดำเนินกิจกรรมตามแผนงาน";
}
